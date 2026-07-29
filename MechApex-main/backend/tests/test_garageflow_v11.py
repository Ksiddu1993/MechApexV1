"""Backend test suite for GarageFlow v1.1 (mobile OTP + garage/job cards).

Covers:
- Auth: send-otp (demo), verify-otp (new main user), auth/me
- Profile: PUT /profile
- Sub-users: create (403 for sub), list, sub-user login
- Catalog: /catalog
- Jobs: create, list (org+role scoping), get w/ history, patch (status→completed sets reminder), timer, photos add/delete
- Reminders: list, dismiss
- Analytics (main only): totals + by_month length 12
- Dashboard: counts + revenue
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://garage-mobile-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _rand_phone(prefix="9") -> str:
    # 10-digit phone, prefix ensures Indian-like
    return prefix + "".join(str((int(time.time() * 1000) >> i) % 10) for i in range(9))


def _auth(phone: str, name: str = "TEST User"):
    r = requests.post(f"{API}/auth/send-otp", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "demo_otp" in body, f"demo_otp missing: {body}"
    otp = body["demo_otp"]
    assert body.get("phone") == phone
    r = requests.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": otp, "name": name}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and "user" in d
    return d


@pytest.fixture(scope="module")
def main_ctx():
    phone = _rand_phone("9")
    d = _auth(phone, "TEST Owner")
    assert d["is_new"] is True
    assert d["user"]["role"] == "main"
    return {"token": d["token"], "user": d["user"], "phone": phone,
            "hdr": {"Authorization": f"Bearer {d['token']}"}}


@pytest.fixture(scope="module")
def sub_ctx(main_ctx):
    sub_phone = _rand_phone("8")
    # Main creates the sub user
    r = requests.post(f"{API}/subusers",
                      json={"name": "TEST Sub", "phone": sub_phone, "aadhar_num": "1111-2222-3333"},
                      headers=main_ctx["hdr"], timeout=15)
    assert r.status_code == 200, r.text
    # Sub logs in with OTP
    d = _auth(sub_phone, "TEST Sub")
    assert d["user"]["role"] == "sub"
    return {"token": d["token"], "user": d["user"], "phone": sub_phone,
            "hdr": {"Authorization": f"Bearer {d['token']}"}}


# ---------------- Auth ----------------
class TestAuth:
    def test_send_otp_invalid_phone(self):
        r = requests.post(f"{API}/auth/send-otp", json={"phone": "123"}, timeout=10)
        assert r.status_code == 400

    def test_send_otp_returns_demo_and_phone(self):
        phone = _rand_phone("9")
        r = requests.post(f"{API}/auth/send-otp", json={"phone": phone}, timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["phone"] == phone
        assert isinstance(b.get("demo_otp"), str) and len(b["demo_otp"]) == 6

    def test_verify_otp_invalid(self):
        phone = _rand_phone("9")
        requests.post(f"{API}/auth/send-otp", json={"phone": phone}, timeout=15)
        r = requests.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "000000"}, timeout=15)
        assert r.status_code == 400

    def test_auth_me_returns_current_user(self, main_ctx):
        r = requests.get(f"{API}/auth/me", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        u = r.json()
        assert u["id"] == main_ctx["user"]["id"]
        assert u["role"] == "main"


# ---------------- Profile ----------------
class TestProfile:
    def test_update_profile(self, main_ctx):
        payload = {"garage_name": "TEST Auto Care", "gstin": "29ABCDE1234F1Z5",
                   "telephone": main_ctx["phone"], "email": "test@example.com",
                   "address": "TEST addr", "lat": 12.97, "lng": 77.59}
        r = requests.put(f"{API}/profile", json=payload, headers=main_ctx["hdr"], timeout=15)
        assert r.status_code == 200
        u = r.json()
        for k, v in payload.items():
            assert u.get(k) == v, f"{k}: {u.get(k)} != {v}"


# ---------------- Sub-users ----------------
class TestSubUsers:
    def test_main_creates_sub_and_lists(self, main_ctx, sub_ctx):
        r = requests.get(f"{API}/subusers", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        lst = r.json()
        assert any(s["id"] == sub_ctx["user"]["id"] for s in lst)

    def test_sub_forbidden_to_create_subuser(self, sub_ctx):
        r = requests.post(f"{API}/subusers",
                          json={"name": "X", "phone": _rand_phone("7"), "aadhar_num": "1"},
                          headers=sub_ctx["hdr"], timeout=10)
        assert r.status_code == 403


# ---------------- Catalog ----------------
class TestCatalog:
    def test_catalog_shape(self, main_ctx):
        r = requests.get(f"{API}/catalog", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        c = r.json()
        for k in ("two_wheeler", "four_wheeler", "fuel_types",
                  "default_services_two_wheeler", "default_services_four_wheeler", "checklist"):
            assert k in c
        assert "Hero" in c["two_wheeler"]
        assert "Maruti Suzuki" in c["four_wheeler"]
        assert any(x["key"] == "brakes" for x in c["checklist"])


# ---------------- Jobs ----------------
class TestJobs:
    @pytest.fixture(scope="class")
    def job_id(self, main_ctx):
        payload = {
            "vehicle_class": "four_wheeler",
            "service_type": "service",
            "customer_name": "TEST Cust",
            "customer_phone": "9123456789",
            "vehicle_brand": "Maruti Suzuki",
            "vehicle_model": "Swift",
            "vehicle_reg_no": "ka 01 ab 1234",
            "vehicle_year": 2020,
            "fuel": "Petrol",
            "odometer": 45000,
            "complaint": "TEST brake noise",
            "items": [{"name": "General Service", "category": "service", "price": 1500, "qty": 1},
                      {"name": "Brake Pads (Front)", "category": "part", "price": 2500, "qty": 1}],
        }
        r = requests.post(f"{API}/jobs", json=payload, headers=main_ctx["hdr"], timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert d["total"] == 4000
        assert d["vehicle_reg_no"] == "KA01AB1234"  # normalized
        return d["id"]

    def test_list_jobs_owner_scope(self, main_ctx, job_id):
        r = requests.get(f"{API}/jobs", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        lst = r.json()
        assert any(j["id"] == job_id for j in lst)

    def test_sub_cannot_see_main_job(self, sub_ctx, job_id):
        r = requests.get(f"{API}/jobs", headers=sub_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        assert not any(j["id"] == job_id for j in r.json())

    def test_get_job_returns_history_shape(self, main_ctx, job_id):
        r = requests.get(f"{API}/jobs/{job_id}", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "job" in d and "history" in d
        assert isinstance(d["history"], list)

    def test_patch_status_completed_sets_reminder(self, main_ctx, job_id):
        r = requests.patch(f"{API}/jobs/{job_id}", json={"status": "completed"},
                           headers=main_ctx["hdr"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "completed"
        assert d["reminder_at"] is not None
        assert d["reminder_done"] is False
        assert d["completed_at"] is not None

    def test_timer_start_pause(self, main_ctx):
        payload = {
            "vehicle_class": "two_wheeler", "service_type": "service",
            "customer_name": "TEST T", "customer_phone": "9111111111",
            "vehicle_brand": "Hero", "vehicle_model": "Splendor Plus",
            "vehicle_reg_no": "TN01XY9999",
            "items": [{"name": "Wash", "category": "wash", "price": 200, "qty": 1}],
        }
        r = requests.post(f"{API}/jobs", json=payload, headers=main_ctx["hdr"], timeout=15)
        jid = r.json()["id"]
        r = requests.post(f"{API}/jobs/{jid}/timer", json={"action": "start"},
                          headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        assert r.json()["timer_running"] is True
        time.sleep(2)
        r = requests.post(f"{API}/jobs/{jid}/timer", json={"action": "pause"},
                          headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["timer_running"] is False
        assert d["timer_seconds"] >= 1

    def test_photo_add_and_delete(self, main_ctx, job_id):
        b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        r = requests.post(f"{API}/jobs/{job_id}/photos",
                          json={"image_base64": b64, "annotation_paths": [{"d": "M0,0 L1,1"}], "note": "TEST"},
                          headers=main_ctx["hdr"], timeout=15)
        assert r.status_code == 200
        pid = r.json()["photo_id"]
        # verify present
        r = requests.get(f"{API}/jobs/{job_id}", headers=main_ctx["hdr"], timeout=10)
        photos = r.json()["job"]["photos"]
        assert any(p["id"] == pid for p in photos)
        # delete
        r = requests.delete(f"{API}/jobs/{job_id}/photos/{pid}", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200


# ---------------- Reminders ----------------
class TestReminders:
    def test_list_and_dismiss_reminder(self, main_ctx):
        # Ensure at least one completed job exists (from previous test class this session)
        # Create + complete a fresh one to be safe
        payload = {
            "vehicle_class": "four_wheeler", "service_type": "service",
            "customer_name": "TEST Rem", "customer_phone": "9222222222",
            "vehicle_brand": "Hyundai", "vehicle_model": "i20", "vehicle_reg_no": "KA02ZZ0001",
            "items": [{"name": "Oil", "category": "service", "price": 500, "qty": 1}],
        }
        r = requests.post(f"{API}/jobs", json=payload, headers=main_ctx["hdr"], timeout=15)
        jid = r.json()["id"]
        requests.patch(f"{API}/jobs/{jid}", json={"status": "completed"}, headers=main_ctx["hdr"], timeout=15)
        r = requests.get(f"{API}/reminders", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list)
        assert any(x["id"] == jid for x in lst)
        r = requests.patch(f"{API}/reminders/{jid}/dismiss", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        r = requests.get(f"{API}/reminders", headers=main_ctx["hdr"], timeout=10)
        assert not any(x["id"] == jid for x in r.json())


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_analytics_main_only(self, sub_ctx):
        r = requests.get(f"{API}/analytics", headers=sub_ctx["hdr"], timeout=10)
        assert r.status_code == 403

    def test_analytics_shape(self, main_ctx):
        r = requests.get(f"{API}/analytics", headers=main_ctx["hdr"], timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "total_revenue" in d
        assert "vehicle_count" in d
        assert isinstance(d["by_month"], list) and len(d["by_month"]) == 12
        assert isinstance(d["jobs"], list)


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_shape(self, main_ctx):
        r = requests.get(f"{API}/dashboard", headers=main_ctx["hdr"], timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("counts", "jobs_today", "revenue", "recent", "reminders_due"):
            assert k in d
        for st in ("pending", "in_progress", "ready", "completed"):
            assert st in d["counts"]
