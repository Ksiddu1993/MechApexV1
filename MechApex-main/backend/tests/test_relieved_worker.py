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

def test_relieved_worker_flow():
    # 1. Register main owner
    p1 = _rand_phone()
    r1 = _login(p1, "Owner Jack")
    assert r1.status_code == 200
    token_owner = r1.json()["token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    # 2. Add active worker with joining date
    worker_phone = _rand_phone()
    r_add = requests.post(f"{BASE}/subusers", json={
        "name": "Worker Bob",
        "phone": worker_phone,
        "aadhar_num": "123456789012",
        "joining_date": "2026-01-15",
    }, headers=headers_owner)
    assert r_add.status_code == 200, r_add.text
    worker_data = r_add.json()
    assert worker_data["joining_date"] == "2026-01-15"
    assert worker_data["status"] == "active"
    worker_id = worker_data["id"]

    # 3. Verify active worker can log in
    r_w_login = _login(worker_phone)
    assert r_w_login.status_code == 200
    token_worker = r_w_login.json()["token"]
    headers_worker = {"Authorization": f"Bearer {token_worker}"}

    # Verify active worker API call works
    r_me = requests.get(f"{BASE}/auth/me", headers=headers_worker)
    assert r_me.status_code == 200

    # 4. Owner relieves worker
    r_relieve = requests.patch(f"{BASE}/subusers/{worker_id}", json={
        "relieving_date": "2026-07-22",
        "status": "relieved"
    }, headers=headers_owner)
    assert r_relieve.status_code == 200
    assert r_relieve.json()["status"] == "relieved"
    assert r_relieve.json()["relieving_date"] == "2026-07-22"

    # 5. Verify relieved worker API token is now BLOCKED (403)
    r_blocked_me = requests.get(f"{BASE}/auth/me", headers=headers_worker)
    assert r_blocked_me.status_code == 403
    assert "relieved" in r_blocked_me.json()["detail"].lower()

    # 6. Verify relieved worker OTP login is BLOCKED (403)
    r_blocked_login = _login(worker_phone)
    assert r_blocked_login.status_code == 403
    assert "relieved" in r_blocked_login.json()["detail"].lower()
