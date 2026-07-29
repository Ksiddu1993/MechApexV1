import time, requests, datetime

BASE = "http://127.0.0.1:8000/api"

def _rand_phone() -> str:
    return "9" + "".join(str((int(time.time() * 1000) >> i) % 10) for i in range(9))

def _login(phone: str, name: str = "Test Owner"):
    r_send = requests.post(f"{BASE}/auth/send-otp", json={"phone": phone})
    assert r_send.status_code == 200, r_send.text
    otp = r_send.json()["demo_otp"]
    r_verify = requests.post(f"{BASE}/auth/verify-otp", json={"phone": phone, "otp": otp, "name": name})
    return r_verify

def test_add_customer_and_lookup_flow():
    # 1. Register main owner
    owner_phone = _rand_phone()
    r_owner = _login(owner_phone, "Garage Owner Jack")
    assert r_owner.status_code == 200
    token_owner = r_owner.json()["token"]
    hdr_owner = {"Authorization": f"Bearer {token_owner}"}

    # 2. Add customer directly from Customers tab (+ Add Customer button)
    cust_phone = _rand_phone()
    r_add_cust = requests.post(f"{BASE}/customers", json={
        "name": "Anil Verma",
        "phone": cust_phone,
        "email": "anil@example.com",
        "address": "Indiranagar, Bangalore",
        "notes": "VIP Client",
        "vehicle_class": "four_wheeler",
        "vehicle_brand": "Honda",
        "vehicle_model": "City",
        "vehicle_reg_no": "KA01EV9999",
        "fuel": "Petrol",
        "vehicle_year": 2022
    }, headers=hdr_owner)
    assert r_add_cust.status_code == 200, r_add_cust.text
    added_cust = r_add_cust.json()
    assert added_cust["name"] == "Anil Verma"
    assert added_cust["phone"] == cust_phone
    assert len(added_cust["vehicles"]) == 1
    assert added_cust["vehicles"][0]["reg_no"] == "KA01EV9999"

    # 3. List customers and verify added customer is included
    r_list = requests.get(f"{BASE}/customers", headers=hdr_owner)
    assert r_list.status_code == 200
    c_list = r_list.json()
    assert any(c["phone"] == cust_phone for c in c_list)

    # 4. Lookup customer by phone for job card auto-fill
    r_lookup = requests.get(f"{BASE}/customers/lookup?phone={cust_phone}", headers=hdr_owner)
    assert r_lookup.status_code == 200
    lookup_res = r_lookup.json()
    assert lookup_res["found"] is True
    cust_info = lookup_res["customer"]
    assert cust_info["name"] == "Anil Verma"
    assert len(cust_info["vehicles"]) >= 1
    assert cust_info["vehicles"][0]["brand"] == "Honda"
    assert cust_info["vehicles"][0]["model"] == "City"
    assert cust_info["vehicles"][0]["reg_no"] == "KA01EV9999"

def test_job_card_serial_number_format():
    owner_phone = _rand_phone()
    r_owner = _login(owner_phone, "Serial Test Owner")
    assert r_owner.status_code == 200
    token_owner = r_owner.json()["token"]
    hdr_owner = {"Authorization": f"Bearer {token_owner}"}

    cur_year = datetime.datetime.now(datetime.timezone.utc).year

    # Create 1st job card
    r_job1 = requests.post(f"{BASE}/jobs", json={
        "vehicle_class": "four_wheeler",
        "service_type": "service",
        "customer_name": "Rohan Gupta",
        "customer_phone": "9876543210",
        "vehicle_brand": "Maruti Suzuki",
        "vehicle_model": "Swift",
        "vehicle_reg_no": "KA05MH1001",
        "items": [{"name": "Oil Change", "category": "service", "price": 1500, "qty": 1}]
    }, headers=hdr_owner)
    assert r_job1.status_code == 200, r_job1.text
    j1 = r_job1.json()
    assert j1["job_card_no"] == f"JC-{cur_year}-0001"

    # Create 2nd job card
    r_job2 = requests.post(f"{BASE}/jobs", json={
        "vehicle_class": "two_wheeler",
        "service_type": "washing",
        "customer_name": "Suresh Kumar",
        "customer_phone": "9876543211",
        "vehicle_brand": "Honda 2W",
        "vehicle_model": "Activa 6G",
        "vehicle_reg_no": "KA05MH1002",
        "items": [{"name": "Foam Wash", "category": "wash", "price": 300, "qty": 1}]
    }, headers=hdr_owner)
    assert r_job2.status_code == 200, r_job2.text
    j2 = r_job2.json()
    assert j2["job_card_no"] == f"JC-{cur_year}-0002"
