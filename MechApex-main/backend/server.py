from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any
import uuid
import jwt
import httpx
from datetime import datetime, timedelta, timezone
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    LlmChat = None
    UserMessage = None

from catalog import (
    TWO_WHEELERS, FOUR_WHEELERS, FUEL_TYPES,
    DEFAULT_SERVICES_TWO_WHEELER, DEFAULT_SERVICES_FOUR_WHEELER,
    STANDARD_CHECKLIST,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'garageflow_db')
JWT_SECRET = os.environ.get('JWT_SECRET', 'garageflow_secret_key_123456789')

if os.environ.get('USE_MOCK_DB', 'true').lower() == 'true' or not MONGO_URL:
    try:
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
    except Exception:
        client = AsyncIOMotorClient(MONGO_URL or 'mongodb://localhost:27017')
else:
    client = AsyncIOMotorClient(MONGO_URL)

db = client[DB_NAME]
JWT_ALG = 'HS256'
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
MSG91_AUTH_KEY = os.environ.get('MSG91_AUTH_KEY')
MSG91_TEMPLATE_ID = os.environ.get('MSG91_TEMPLATE_ID')
MSG91_SENDER_ID = os.environ.get('MSG91_SENDER_ID', 'GRGFLW')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def norm_phone(p: str) -> str:
    """Strip non-digits."""
    return ''.join(ch for ch in (p or '') if ch.isdigit())


def make_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": now_utc() + timedelta(days=30), "iat": now_utc()},
        JWT_SECRET, algorithm=JWT_ALG,
    )


def gen_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


async def send_sms_otp(phone: str, otp: str) -> dict:
    """Send OTP via MSG91. Returns dict with demo_otp when in demo mode."""
    if not (MSG91_AUTH_KEY and MSG91_TEMPLATE_ID):
        return {"demo": True, "demo_otp": otp}
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(
                "https://control.msg91.com/api/v5/otp",
                params={"template_id": MSG91_TEMPLATE_ID, "mobile": phone, "otp": otp, "sender": MSG91_SENDER_ID},
                headers={"authkey": MSG91_AUTH_KEY},
            )
            if r.status_code != 200:
                logging.error(f"MSG91 error {r.status_code}: {r.text}")
                return {"demo": True, "demo_otp": otp, "warning": "SMS delivery failed, showing OTP on screen"}
        return {"demo": False}
    except Exception as e:
        logging.exception("MSG91 failed")
        return {"demo": True, "demo_otp": otp, "warning": f"SMS error: {e}"}


async def current_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not cred:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "otp": 0, "otp_expires": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("role") == "sub" and (user.get("status") == "relieved" or user.get("relieving_date")):
        raise HTTPException(status_code=403, detail="This worker account has been relieved / discontinued.")
    return user


async def require_main(u=Depends(current_user)) -> dict:
    if u.get("role") != "main":
        raise HTTPException(status_code=403, detail="Owner only")
    return u


def org_id_of(u: dict) -> str:
    """Both main users and sub users share the same org_id (main user's id)."""
    return u.get("org_id") or u["id"]


# ---------------- Models ----------------
class SendOtpIn(BaseModel):
    phone: str

class VerifyOtpIn(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None  # only used on first-time registration for main user

class SubUserCreateIn(BaseModel):
    name: str
    phone: str
    dl_num: Optional[str] = None
    aadhar_num: str
    joining_date: Optional[str] = None
    relieving_date: Optional[str] = None

class SubUserUpdateIn(BaseModel):
    name: Optional[str] = None
    dl_num: Optional[str] = None
    aadhar_num: Optional[str] = None
    joining_date: Optional[str] = None
    relieving_date: Optional[str] = None
    status: Optional[str] = None

class ProfileIn(BaseModel):
    name: Optional[str] = None
    garage_name: Optional[str] = None
    gstin: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    photo_base64: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class ServiceItem(BaseModel):
    name: str
    category: Literal["service", "part", "wash"] = "service"
    price: float
    qty: int = 1


class JobIn(BaseModel):
    vehicle_class: Literal["two_wheeler", "four_wheeler"]
    service_type: Literal["service", "washing"]
    customer_name: str
    customer_phone: str
    vehicle_brand: str
    vehicle_model: str
    vehicle_reg_no: str
    vehicle_year: Optional[int] = None
    fuel: Optional[str] = None
    odometer: Optional[int] = None
    complaint: Optional[str] = None
    items: List[ServiceItem] = []


class JobPatchIn(BaseModel):
    vehicle_class: Optional[Literal["two_wheeler", "four_wheeler"]] = None
    service_type: Optional[Literal["service", "washing"]] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    vehicle_year: Optional[int] = None
    fuel: Optional[str] = None
    odometer: Optional[int] = None
    complaint: Optional[str] = None
    items: Optional[List[ServiceItem]] = None
    checklist: Optional[dict] = None
    status: Optional[Literal["pending", "in_progress", "ready", "completed"]] = None
    total: Optional[float] = None


class CustomerIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    vehicle_class: Optional[Literal["two_wheeler", "four_wheeler"]] = None
    fuel: Optional[str] = None
    vehicle_year: Optional[int] = None


class UpgradeIn(BaseModel):
    package_id: Literal["500", "1000", "5000"]


class TimerActionIn(BaseModel):
    action: Literal["start", "pause", "stop"]


class PhotoIn(BaseModel):
    image_base64: str
    annotation_paths: Optional[List[Any]] = None  # array of SVG paths (any shape)
    note: Optional[str] = None


# ---------------- Auth ----------------
@api_router.post("/auth/send-otp")
async def send_otp(body: SendOtpIn):
    phone = norm_phone(body.phone)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    otp = gen_otp()
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"phone": phone, "otp": otp, "expires_at": now_utc() + timedelta(minutes=10)}},
        upsert=True,
    )
    result = await send_sms_otp(phone, otp)
    resp = {"message": "OTP sent", "phone": phone}
    if result.get("demo"):
        resp["demo_otp"] = otp
        if result.get("warning"):
            resp["warning"] = result["warning"]
    return resp


@api_router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpIn):
    phone = norm_phone(body.phone)
    rec = await db.otps.find_one({"phone": phone})
    if not rec:
        raise HTTPException(status_code=400, detail="OTP not requested")
    exp = rec["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc():
        raise HTTPException(status_code=400, detail="OTP expired")
    if rec["otp"] != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    await db.otps.delete_one({"phone": phone})

    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    if user and user.get("role") == "sub":
        if user.get("status") == "relieved" or user.get("relieving_date"):
            raise HTTPException(status_code=403, detail="This worker account has been relieved / discontinued by the owner.")

    is_new = False
    if not user:
        # First time — create as main user
        uid = str(uuid.uuid4())
        user = {
            "id": uid,
            "phone": phone,
            "role": "main",
            "org_id": uid,
            "name": body.name or "",
            "garage_name": "",
            "gstin": "",
            "telephone": phone,
            "email": "",
            "photo_base64": "",
            "address": "",
            "lat": None,
            "lng": None,
            "created_at": now_utc(),
        }
        await db.users.insert_one(user.copy())
        is_new = True
    token = make_token(user["id"])
    user_out = {k: v for k, v in user.items() if k != "_id"}
    user_out["is_onboarded"] = bool(user.get("garage_name") and user.get("name"))
    return {"token": token, "user": user_out, "is_new": is_new}


@api_router.get("/auth/me")
async def me(u=Depends(current_user)):
    res = dict(u)
    res["is_onboarded"] = bool(u.get("garage_name") and u.get("name"))
    return res


@api_router.put("/profile")
async def update_profile(body: ProfileIn, u=Depends(current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": u["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": u["id"]}, {"_id": 0, "otp": 0, "otp_expires": 0})
    return fresh


# ---------------- Sub users (main only) ----------------
@api_router.post("/subusers")
async def create_subuser(body: SubUserCreateIn, u=Depends(require_main)):
    phone = norm_phone(body.phone)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    exists = await db.users.find_one({"phone": phone})
    if exists:
        raise HTTPException(status_code=400, detail="Phone already registered")
    sid = str(uuid.uuid4())
    today_str = now_utc().strftime("%Y-%m-%d")
    is_relieved = bool(body.relieving_date)
    doc = {
        "id": sid,
        "phone": phone,
        "role": "sub",
        "org_id": u["id"],
        "name": body.name,
        "dl_num": body.dl_num or "",
        "aadhar_num": body.aadhar_num,
        "joining_date": body.joining_date or today_str,
        "relieving_date": body.relieving_date or None,
        "status": "relieved" if is_relieved else "active",
        "photo_base64": "",
        "created_at": now_utc(),
    }
    await db.users.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.patch("/subusers/{sid}")
async def update_subuser(sid: str, body: SubUserUpdateIn, u=Depends(require_main)):
    target = await db.users.find_one({"id": sid, "org_id": u["id"], "role": "sub"})
    if not target:
        raise HTTPException(status_code=404, detail="Worker not found")

    patch: dict = {}
    if body.name is not None: patch["name"] = body.name
    if body.dl_num is not None: patch["dl_num"] = body.dl_num
    if body.aadhar_num is not None: patch["aadhar_num"] = body.aadhar_num
    if body.joining_date is not None: patch["joining_date"] = body.joining_date
    if body.relieving_date is not None:
        patch["relieving_date"] = body.relieving_date
        if body.relieving_date:
            patch["status"] = "relieved"
    if body.status is not None: patch["status"] = body.status

    if patch:
        await db.users.update_one({"id": sid, "org_id": u["id"]}, {"$set": patch})

    updated = await db.users.find_one({"id": sid}, {"_id": 0})
    return updated


@api_router.get("/subusers")
async def list_subusers(u=Depends(require_main)):
    docs = await db.users.find({"org_id": u["id"], "role": "sub"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.delete("/subusers/{sid}")
async def delete_subuser(sid: str, u=Depends(require_main)):
    await db.users.delete_one({"id": sid, "org_id": u["id"], "role": "sub"})
    return {"ok": True}


# ---------------- Catalog ----------------
@api_router.get("/catalog")
async def catalog():
    return {
        "two_wheeler": TWO_WHEELERS,
        "four_wheeler": FOUR_WHEELERS,
        "fuel_types": FUEL_TYPES,
        "default_services_two_wheeler": DEFAULT_SERVICES_TWO_WHEELER,
        "default_services_four_wheeler": DEFAULT_SERVICES_FOUR_WHEELER,
        "checklist": STANDARD_CHECKLIST,
    }


# ---------------- Jobs ----------------
def compute_total(items: list) -> float:
    return round(sum((i.get("price", 0) or 0) * (i.get("qty", 1) or 1) for i in (items or [])), 2)


def scrub_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    if "job_card_no" not in doc or not doc["job_card_no"]:
        cid = doc.get("id", "0000")
        year = doc.get("created_at", "2026")[:4] if doc.get("created_at") else "2026"
        doc["job_card_no"] = f"JC-{year}-{cid[:4].upper()}"
    return doc


@api_router.post("/jobs")
async def create_job(body: JobIn, u=Depends(current_user)):
    org_id = org_id_of(u)
    # Check job card limit (default 100 for free tier)
    main_user = await db.users.find_one({"id": org_id}) or u
    limit = main_user.get("job_card_limit", 100)
    current_count = await db.jobs.count_documents({"org_id": org_id})
    if current_count >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"Job card limit reached ({current_count}/{limit} used). Please upgrade your package to create more job cards."
        )

    jid = str(uuid.uuid4())
    items = [i.model_dump() for i in body.items]

    # Generate sequential Job Card Number: JC-YYYY-0001
    current_year = datetime.now(timezone.utc).year
    year_prefix = f"JC-{current_year}-"
    count_year = await db.jobs.count_documents({
        "org_id": org_id,
        "job_card_no": {"$regex": f"^{year_prefix}"}
    })
    job_card_no = f"JC-{current_year}-{(count_year + 1):04d}"

    doc = {
        "id": jid,
        "job_card_no": job_card_no,
        "org_id": org_id,
        "created_by": u["id"],
        "created_by_name": u.get("name") or u.get("phone"),
        "status": "pending",
        "vehicle_class": body.vehicle_class,
        "service_type": body.service_type,
        "customer_name": body.customer_name,
        "customer_phone": norm_phone(body.customer_phone),
        "vehicle_brand": body.vehicle_brand,
        "vehicle_model": body.vehicle_model,
        "vehicle_reg_no": body.vehicle_reg_no.upper().replace(" ", ""),
        "vehicle_year": body.vehicle_year,
        "fuel": body.fuel,
        "odometer": body.odometer,
        "complaint": body.complaint or "",
        "items": items,
        "checklist": {},
        "photos": [],
        "timer_seconds": 0,
        "timer_running": False,
        "timer_started_at": None,
        "total": compute_total(items),
        "created_at": now_utc(),
        "updated_at": now_utc(),
        "completed_at": None,
        "reminder_at": None,
        "reminder_done": False,
    }
    await db.jobs.insert_one(doc.copy())
    return scrub_id(doc)


@api_router.get("/jobs")
async def list_jobs(response: Response, status_filter: Optional[str] = None, u=Depends(current_user)):
    org_id = org_id_of(u)
    q: dict = {"org_id": org_id}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    if status_filter and status_filter != "all":
        q["status"] = status_filter
    docs = await db.jobs.find(q, {"_id": 0, "photos": 0}).sort("created_at", -1).to_list(500)
    total_count = await db.jobs.count_documents({"org_id": org_id})
    main_user = await db.users.find_one({"id": org_id}) or u
    limit = main_user.get("job_card_limit", 100)
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Job-Limit"] = str(limit)
    response.headers["X-Limit-Reached"] = "true" if total_count >= limit else "false"
    return [scrub_id(d) for d in docs]


@api_router.get("/jobs/{jid}")
async def get_job(jid: str, u=Depends(current_user)):
    q: dict = {"id": jid, "org_id": org_id_of(u)}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    doc = await db.jobs.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    # last services for the same reg no
    last = await db.jobs.find(
        {"org_id": org_id_of(u), "vehicle_reg_no": doc["vehicle_reg_no"], "id": {"$ne": jid}},
        {"_id": 0, "id": 1, "status": 1, "items": 1, "total": 1, "created_at": 1, "service_type": 1},
    ).sort("created_at", -1).limit(5).to_list(5)
    return {"job": doc, "history": last}


@api_router.patch("/jobs/{jid}")
async def patch_job(jid: str, body: JobPatchIn, u=Depends(current_user)):
    q: dict = {"id": jid, "org_id": org_id_of(u)}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    doc = await db.jobs.find_one(q)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    upd: dict = {"updated_at": now_utc()}
    if body.customer_name is not None: upd["customer_name"] = body.customer_name
    if body.customer_phone is not None: upd["customer_phone"] = norm_phone(body.customer_phone)
    if body.vehicle_brand is not None: upd["vehicle_brand"] = body.vehicle_brand
    if body.vehicle_model is not None: upd["vehicle_model"] = body.vehicle_model
    if body.vehicle_reg_no is not None: upd["vehicle_reg_no"] = body.vehicle_reg_no.upper().replace(" ", "")
    if body.vehicle_year is not None: upd["vehicle_year"] = body.vehicle_year
    if body.fuel is not None: upd["fuel"] = body.fuel
    if body.odometer is not None: upd["odometer"] = body.odometer
    if body.vehicle_class is not None: upd["vehicle_class"] = body.vehicle_class
    if body.service_type is not None: upd["service_type"] = body.service_type
    if body.complaint is not None:
        upd["complaint"] = body.complaint
    if body.items is not None:
        items = [i.model_dump() for i in body.items]
        upd["items"] = items
        upd["total"] = compute_total(items)
    if body.total is not None:
        upd["total"] = round(body.total, 2)
    if body.checklist is not None:
        upd["checklist"] = body.checklist
    if body.status is not None:
        upd["status"] = body.status
        if body.status == "completed":
            upd["completed_at"] = now_utc()
            upd["reminder_at"] = now_utc() + timedelta(days=60)
            upd["reminder_done"] = False
            # stop timer if running
            if doc.get("timer_running"):
                started = doc.get("timer_started_at")
                if started:
                    if started.tzinfo is None:
                        started = started.replace(tzinfo=timezone.utc)
                    upd["timer_seconds"] = int((doc.get("timer_seconds") or 0) + (now_utc() - started).total_seconds())
                upd["timer_running"] = False
                upd["timer_started_at"] = None
    await db.jobs.update_one({"id": jid}, {"$set": upd})
    fresh = await db.jobs.find_one({"id": jid}, {"_id": 0})
    return fresh


@api_router.post("/upgrade")
async def upgrade_package(body: UpgradeIn, u=Depends(require_main)):
    limits = {"500": 500, "1000": 1000, "5000": 5000}
    add_limit = limits.get(body.package_id, 500)
    current_limit = u.get("job_card_limit", 100)
    new_limit = current_limit + add_limit
    await db.users.update_one({"id": u["id"]}, {"$set": {"job_card_limit": new_limit, "package_id": body.package_id}})
    return {"ok": True, "job_card_limit": new_limit, "added": add_limit}


@api_router.delete("/jobs/{jid}")
async def delete_job(jid: str, u=Depends(require_main)):
    await db.jobs.delete_one({"id": jid, "org_id": u["id"]})
    return {"ok": True}


@api_router.post("/jobs/{jid}/timer")
async def timer(jid: str, body: TimerActionIn, u=Depends(current_user)):
    q: dict = {"id": jid, "org_id": org_id_of(u)}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    doc = await db.jobs.find_one(q)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    running = doc.get("timer_running", False)
    seconds = doc.get("timer_seconds", 0) or 0
    started = doc.get("timer_started_at")
    if body.action == "start" and not running:
        upd = {"timer_running": True, "timer_started_at": now_utc()}
    elif body.action == "pause" and running:
        if started:
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            seconds += int((now_utc() - started).total_seconds())
        upd = {"timer_running": False, "timer_started_at": None, "timer_seconds": seconds}
    elif body.action == "stop":
        if running and started:
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            seconds += int((now_utc() - started).total_seconds())
        upd = {"timer_running": False, "timer_started_at": None, "timer_seconds": seconds}
    else:
        return {"timer_running": running, "timer_seconds": seconds}
    await db.jobs.update_one({"id": jid}, {"$set": upd})
    fresh = await db.jobs.find_one({"id": jid}, {"_id": 0, "photos": 0})
    return fresh


@api_router.post("/jobs/{jid}/photos")
async def add_photo(jid: str, body: PhotoIn, u=Depends(current_user)):
    q: dict = {"id": jid, "org_id": org_id_of(u)}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    doc = await db.jobs.find_one(q)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    photo = {
        "id": str(uuid.uuid4()),
        "image_base64": body.image_base64,
        "annotation_paths": body.annotation_paths or [],
        "note": body.note or "",
        "created_by": u["id"],
        "created_at": now_utc().isoformat(),
    }
    await db.jobs.update_one({"id": jid}, {"$push": {"photos": photo}, "$set": {"updated_at": now_utc()}})
    return {"ok": True, "photo_id": photo["id"]}


@api_router.delete("/jobs/{jid}/photos/{pid}")
async def delete_photo(jid: str, pid: str, u=Depends(current_user)):
    q: dict = {"id": jid, "org_id": org_id_of(u)}
    if u.get("role") == "sub":
        q["created_by"] = u["id"]
    await db.jobs.update_one(q, {"$pull": {"photos": {"id": pid}}})
    return {"ok": True}


# ---------------- Reminders ----------------
@api_router.get("/reminders")
async def list_reminders(u=Depends(require_main)):
    q: dict = {"org_id": u["id"], "reminder_at": {"$ne": None}, "reminder_done": False}
    docs = await db.jobs.find(q, {"_id": 0, "photos": 0}).sort("reminder_at", 1).to_list(500)
    now = now_utc()
    for d in docs:
        r = d.get("reminder_at")
        if r and r.tzinfo is None:
            r = r.replace(tzinfo=timezone.utc)
        d["due"] = bool(r and r <= now)
    return docs


@api_router.patch("/reminders/{jid}/dismiss")
async def dismiss_reminder(jid: str, u=Depends(require_main)):
    await db.jobs.update_one({"id": jid, "org_id": u["id"]}, {"$set": {"reminder_done": True}})
    return {"ok": True}


# ---------------- Customers ----------------
@api_router.get("/customers")
async def list_customers(u=Depends(current_user)):
    org = org_id_of(u)
    standalone_docs = await db.customers.find({"org_id": org}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    jobs = await db.jobs.find({"org_id": org}, {"_id": 0, "photos": 0}).sort("created_at", -1).to_list(1000)

    customers_map = {}

    for c in standalone_docs:
        phone = c.get("phone")
        if not phone:
            continue
        customers_map[phone] = {
            "id": c.get("id"),
            "name": c.get("name") or "Unknown",
            "phone": phone,
            "email": c.get("email") or "",
            "address": c.get("address") or "",
            "notes": c.get("notes") or "",
            "vehicles": c.get("vehicles") or [],
            "job_count": 0,
            "total_spent": 0,
            "last_visit": c.get("created_at"),
        }

    for j in jobs:
        phone = j.get("customer_phone")
        if not phone:
            continue
        if phone not in customers_map:
            customers_map[phone] = {
                "name": j.get("customer_name") or "Unknown",
                "phone": phone,
                "email": "",
                "address": "",
                "notes": "",
                "vehicles": [],
                "job_count": 0,
                "total_spent": 0,
                "last_visit": j.get("created_at"),
            }
        cust = customers_map[phone]
        cust["job_count"] += 1
        cust["total_spent"] += j.get("total", 0) or 0
        v_info = {
            "brand": j.get("vehicle_brand"),
            "model": j.get("vehicle_model"),
            "reg_no": j.get("vehicle_reg_no"),
            "class": j.get("vehicle_class"),
            "fuel": j.get("fuel"),
            "year": j.get("vehicle_year"),
        }
        if v_info["reg_no"] and not any(v.get("reg_no") == v_info["reg_no"] for v in cust["vehicles"]):
            cust["vehicles"].append(v_info)

    return list(customers_map.values())


@api_router.post("/customers")
async def create_or_update_customer(body: CustomerIn, u=Depends(current_user)):
    org = org_id_of(u)
    phone = norm_phone(body.phone)
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Valid 10-digit phone number is required")
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Customer name is required")

    existing = await db.customers.find_one({"org_id": org, "phone": phone})

    vehicle_entry = None
    if body.vehicle_reg_no or body.vehicle_brand or body.vehicle_model:
        vehicle_entry = {
            "brand": body.vehicle_brand or "",
            "model": body.vehicle_model or "",
            "reg_no": (body.vehicle_reg_no or "").upper().replace(" ", ""),
            "class": body.vehicle_class or "four_wheeler",
            "fuel": body.fuel or "",
            "year": body.vehicle_year,
        }

    now = now_utc()
    if existing:
        vehicles = existing.get("vehicles") or []
        if vehicle_entry and vehicle_entry["reg_no"]:
            idx = next((i for i, v in enumerate(vehicles) if v.get("reg_no") == vehicle_entry["reg_no"]), None)
            if idx is not None:
                vehicles[idx] = vehicle_entry
            else:
                vehicles.append(vehicle_entry)
        elif vehicle_entry:
            vehicles.append(vehicle_entry)

        upd = {
            "name": body.name.strip(),
            "email": body.email or existing.get("email", ""),
            "address": body.address or existing.get("address", ""),
            "notes": body.notes or existing.get("notes", ""),
            "vehicles": vehicles,
            "updated_at": now,
        }
        await db.customers.update_one({"org_id": org, "phone": phone}, {"$set": upd})
        doc = await db.customers.find_one({"org_id": org, "phone": phone}, {"_id": 0})
        return doc
    else:
        cid = str(uuid.uuid4())
        doc = {
            "id": cid,
            "org_id": org,
            "name": body.name.strip(),
            "phone": phone,
            "email": body.email or "",
            "address": body.address or "",
            "notes": body.notes or "",
            "vehicles": [vehicle_entry] if vehicle_entry else [],
            "created_at": now,
            "updated_at": now,
        }
        await db.customers.insert_one(doc)
        doc.pop("_id", None)
        return doc


@api_router.get("/customers/lookup")
async def lookup_customer(phone: Optional[str] = None, q: Optional[str] = None, u=Depends(current_user)):
    org = org_id_of(u)
    p = norm_phone(phone or q or "")
    if not p:
        return {"found": False, "customer": None}

    cust_doc = await db.customers.find_one({"org_id": org, "phone": p}, {"_id": 0})
    jobs = await db.jobs.find({"org_id": org, "customer_phone": p}, {"_id": 0, "photos": 0}).sort("created_at", -1).to_list(50)

    if not cust_doc and not jobs:
        return {"found": False, "customer": None}

    name = (cust_doc and cust_doc.get("name")) or (jobs and jobs[0].get("customer_name")) or "Customer"
    vehicles = (cust_doc and cust_doc.get("vehicles")) or []

    for j in jobs:
        v_info = {
            "brand": j.get("vehicle_brand"),
            "model": j.get("vehicle_model"),
            "reg_no": j.get("vehicle_reg_no"),
            "class": j.get("vehicle_class"),
            "fuel": j.get("fuel"),
            "year": j.get("vehicle_year"),
        }
        if v_info["reg_no"] and not any(v.get("reg_no") == v_info["reg_no"] for v in vehicles):
            vehicles.append(v_info)

    customer_data = {
        "name": name,
        "phone": p,
        "email": cust_doc.get("email") if cust_doc else "",
        "address": cust_doc.get("address") if cust_doc else "",
        "notes": cust_doc.get("notes") if cust_doc else "",
        "vehicles": vehicles,
        "last_job": jobs[0] if jobs else None,
    }
    return {"found": True, "customer": customer_data}


# ---------------- Analytics (main only) ----------------
@api_router.get("/analytics")
async def analytics(year: Optional[int] = None, month: Optional[int] = None, u=Depends(require_main)):
    q = {"org_id": u["id"], "status": "completed"}
    if year and month:
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        end = datetime(year + (1 if month == 12 else 0), (month % 12) + 1, 1, tzinfo=timezone.utc)
        q["completed_at"] = {"$gte": start, "$lt": end}
    docs = await db.jobs.find(q, {"_id": 0, "photos": 0}).to_list(5000)

    total_revenue = sum(d.get("total", 0) for d in docs)
    vehicle_count = len(docs)
    # by month bucket for the current year (or requested)
    yr = year or now_utc().year
    by_month = [0] * 12
    for d in docs:
        c = d.get("completed_at") or d.get("created_at")
        if not c:
            continue
        if c.tzinfo is None:
            c = c.replace(tzinfo=timezone.utc)
        if c.year == yr:
            by_month[c.month - 1] += d.get("total", 0) or 0

    return {
        "total_revenue": round(total_revenue, 2),
        "vehicle_count": vehicle_count,
        "by_month_year": yr,
        "by_month": by_month,
        "jobs": docs,
    }


# ---------------- Dashboard ----------------
@api_router.get("/dashboard")
async def dashboard(u=Depends(current_user)):
    org = org_id_of(u)
    base: dict = {"org_id": org}
    if u.get("role") == "sub":
        base["created_by"] = u["id"]
    counts = {}
    for st in ["pending", "in_progress", "ready", "completed"]:
        counts[st] = await db.jobs.count_documents({**base, "status": st})
    today_start = datetime(now_utc().year, now_utc().month, now_utc().day, tzinfo=timezone.utc)
    jobs_today = await db.jobs.count_documents({**base, "created_at": {"$gte": today_start}})
    revenue = 0
    async for d in db.jobs.find({**base, "status": "completed"}, {"_id": 0, "total": 1}):
        revenue += d.get("total", 0) or 0
    recent = await db.jobs.find(base, {"_id": 0, "photos": 0}).sort("created_at", -1).limit(6).to_list(6)
    reminders_due = await db.jobs.count_documents({
        **base, "reminder_done": False, "reminder_at": {"$ne": None, "$lte": now_utc()},
    })
    return {
        "counts": counts,
        "jobs_today": jobs_today,
        "revenue": round(revenue, 2),
        "recent": recent,
        "reminders_due": reminders_due,
    }


# ---------------- AI (optional) ----------------
class AiIn(BaseModel):
    issue: str
    vehicle: Optional[str] = None


@api_router.post("/ai/recommend")
async def ai_recommend(body: AiIn, u=Depends(current_user)):
    if not EMERGENT_LLM_KEY or LlmChat is None:
        raise HTTPException(status_code=400, detail="AI not configured")
    system = (
        "You are an automotive service advisor. Respond in concise markdown with sections:\n"
        "**Likely Causes**, **Recommended Services**, **Estimated Labor Hours**, **Suggested Parts**. Keep under 180 words."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"ai-{u['id']}-{uuid.uuid4()}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    prompt = f"Vehicle: {body.vehicle or 'unspecified'}\nProblem: {body.issue}"
    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"response": resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


@api_router.get("/")
async def root():
    return {"message": "MechApex API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware, allow_credentials=True, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
