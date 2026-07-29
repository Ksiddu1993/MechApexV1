import time, requests

BASE = "http://127.0.0.1:8000/api"

def _rand_phone() -> str:
    return "9" + "".join(str((int(time.time() * 1000) >> i) % 10) for i in range(9))

def _login(phone: str, name: str = "Test User"):
    r_send = requests.post(f"{BASE}/auth/send-otp", json={"phone": phone})
    assert r_send.status_code == 200, r_send.text
    otp = r_send.json()["demo_otp"]
    r_verify = requests.post(f"{BASE}/auth/verify-otp", json={"phone": phone, "otp": otp, "name": name})
    return r_verify

def test_owner_edit_all_job_fields_and_upgrade():
    # 1. Register main owner
    owner_phone = _rand_phone()
    r_owner = _login(owner_phone, "Garage Owner")
    assert r_owner.status_code == 200
    token_owner = r_owner.json()["token"]
    hdr_owner = {"Authorization": f"Bearer {token_owner}"}

    # 2. Register worker under owner
    worker_phone = _rand_phone()
    r_w_add = requests.post(f"{BASE}/subusers", json={
        "name": "Mechanic Dave",
        "phone": worker_phone,
        "aadhar_num": "987654321098",
    }, headers=hdr_owner)
    assert r_w_add.status_code == 200

    # 3. Worker creates a job card
    r_w_login = _login(worker_phone)
    token_worker = r_w_login.json()["token"]
    hdr_worker = {"Authorization": f"Bearer {token_worker}"}

    r_job = requests.post(f"{BASE}/jobs", json={
        "vehicle_class": "four_wheeler",
        "service_type": "service",
        "customer_name": "Rohan Sharma",
        "customer_phone": "9876500011",
        "vehicle_brand": "Maruti",
        "vehicle_model": "Swift",
        "vehicle_reg_no": "KA01AB1234",
        "odometer": 45000,
        "complaint": "Engine noise",
        "items": [{"name": "Oil Change", "category": "service", "price": 1500, "qty": 1}]
    }, headers=hdr_worker)
    assert r_job.status_code == 200
    job_id = r_job.json()["id"]

    # 4. Owner edits worker's job card items and prices directly
    r_patch_items = requests.patch(f"{BASE}/jobs/{job_id}", json={
        "items": [
            {"name": "Synthetic Engine Oil", "category": "part", "price": 2400, "qty": 1},
            {"name": "Oil Filter Replacement", "category": "part", "price": 450, "qty": 1},
            {"name": "Labor Charges", "category": "service", "price": 500, "qty": 1}
        ]
    }, headers=hdr_owner)
    assert r_patch_items.status_code == 200
    item_edited = r_patch_items.json()
    assert len(item_edited["items"]) == 3
    assert item_edited["total"] == 3350.0

    # 5. Owner edits ALL fields of worker's job card INCLUDING total amount
    r_patch = requests.patch(f"{BASE}/jobs/{job_id}", json={
        "customer_name": "Rohan Sharma Updated",
        "customer_phone": "9876599999",
        "vehicle_brand": "Hyundai",
        "vehicle_model": "i20",
        "vehicle_reg_no": "KA05XY9999",
        "odometer": 48000,
        "complaint": "Engine noise resolved + General Service",
        "total": 3500.0,
    }, headers=hdr_owner)
    assert r_patch.status_code == 200
    edited = r_patch.json()
    assert edited["customer_name"] == "Rohan Sharma Updated"
    assert edited["vehicle_brand"] == "Hyundai"
    assert edited["vehicle_reg_no"] == "KA05XY9999"
    assert edited["odometer"] == 48000
    assert edited["total"] == 3500.0

    # 6. Owner upgrades package
    r_upg = requests.post(f"{BASE}/upgrade", json={"package_id": "1000"}, headers=hdr_owner)
    assert r_upg.status_code == 200
    assert r_upg.json()["job_card_limit"] >= 1100
