🔑 Security
Surepass Encrypted API Integration Guide
📋 Overview
This guide provides comprehensive instructions for integrating with the Surepass Encrypted API, which uses RSA-2048 + AES-256-GCM encryption to secure all data transmission between your application and our services.
Prerequisites
Before starting your integration, ensure you have:
Valid Surepass API credentials (Bearer token)
Your assigned Client ID
RSA key pair provided by Surepass
Basic understanding of HTTP APIs and encryption concepts
🔑 Security Keys Setup
Your Surepass representative will provide three essential components:
client-id: your-company@surepass.io
client-private-key.pem - Your private key (keep secure!)
surepass-public-key.pem - Surepass public key (for encryption)
Important: Never commit private keys to version control or log them in your application.
Environment Configuration
Store your credentials securely using environment variables:
export SUREPASS_CLIENT_ID="your-company@surepass.io"
export SUREPASS_CLIENT_PRIVATE_KEY="$(cat client-private-key.pem)"
export SUREPASS_PUBLIC_KEY="$(cat surepass-public-key.pem)"
export SUREPASS_API_TOKEN="your-bearer-token"
Environment	API Base URL
Sandbox	https://sandbox-encrypted.surepass.app
Production	https://kyc-api-encrypted.surepass.app
Superflow Sandbox	https://superflow-sandbox-encrypted.surepass.app
Superflow Prod	https://superflow-encrypted.surepass.app
API Flow Comparison
Your App → Encrypt Request → HTTPS → Decrypt → Surepass API
                                                              ↓
Your App ← Decrypt Response ← HTTPS ← Encrypt ← Response
Enhanced security with end-to-end encryption using RSA + AES hybrid encryption.
Request Format Structure
1
Prepare Your Data
Create your request payload as usual (JSON, form-data, etc.)
2
Encrypt the Payload
Generate random AES-256 key and IV
Encrypt your data with AES-256-GCM
Encrypt the AES key with Surepass's RSA public key
Combine into encrypted payload format
3
Set Required Headers
POST /api/v1/pan/pan HTTP/1.1
Host: kyc-api-encrypted.surepass.io
Authorization: Bearer YOUR_API_TOKEN
x-client-id: your-company@surepass.io
Content-Type: text/plain
x-content-type: application/json
x-content-length: 27
4
Send Encrypted Request
The request body contains the encrypted payload string in the format:
encrypted_aes_key:iv:encrypted_data:auth_tag
Response Handling
📥 Decryption Process
1.
Receive encrypted response (HTTP 200)
2.
Extract AES key, IV, data, and auth tag from response
3.
Decrypt AES key using your RSA private key
4.
Decrypt response data using AES-256-GCM
5.
Parse the decrypted JSON data
Language-Specific Integration
Installation
pip install requests cryptography
Basic Implementation
import requests
from cryptography.hazmat.primitives import hashes, padding, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import base64, secrets, json

aes_key = secrets.token_bytes(32)
iv = secrets.token_bytes(12)
payload = json.dumps({"pan_number": "ABCDE1234F"})

cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
encryptor = cipher.encryptor()
encrypted_data = encryptor.update(payload.encode()) + encryptor.finalize()

with open('surepass-public-key.pem', 'rb') as f:
    server_key = serialization.load_pem_public_key(f.read())
encrypted_aes_key = server_key.encrypt(aes_key, padding.OAEP(
    mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))

encrypted_payload = ':'.join([
    base64.b64encode(encrypted_aes_key).decode(),
    base64.b64encode(iv).decode(),
    base64.b64encode(encrypted_data).decode(),
    base64.b64encode(encryptor.tag).decode()
])

response = requests.post(
    "https://kyc-api-encrypted.surepass.app/api/v1/pan/pan",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "x-client-id": "your-company@surepass.io",
        "Content-Type": "text/plain",
        "x-content-type": "application/json",
        "x-content-length": str(len(payload))
    },
    data=encrypted_payload
)

with open('client-private-key.pem', 'rb') as f:
    client_key = serialization.load_pem_private_key(f.read(), password=None)
parts = response.text.split(':')
encrypted_aes_key = base64.b64decode(parts[0])
iv = base64.b64decode(parts[1])
encrypted_data = base64.b64decode(parts[2])
authtag = base64.b64decode(parts[3])

aes_key = client_key.decrypt(encrypted_aes_key, padding.OAEP(
    mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, authtag))
decryptor = cipher.decryptor()
decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()

result = json.loads(decrypted_data.decode())
print(f"PAN: {result['data']['pan_number']}")
print(f"Name: {result['data']['full_name']}")
Testing Your Integration
1
Test PAN Verification
{
  "pan_number": "ABCDE1234F"
}
Expected response should return PAN details with success status.
2
Test File Upload (PAN OCR)
Upload a sample PAN card image to test OCR functionality.
Expected response should include extracted PAN information with confidence scores.
3
Verify Response Format
Ensure decrypted responses match the standard API format:
{
  "success": true,
  "status_code": 200,
  "data": { ... },
  "message": null,
  "message_code": "success"
}
Encryption Public Keys
Public Key Description	Link	URL
Superflow Production Public Key	Link	https://cdn.surepass.app/public-keys/superflow-production-at-surepass.app-public-key.pem
Superflow Sandbox Public Key	Link	https://cdn.surepass.app/public-keys/superflow-sandbox-at-surepass.app-public-key.pem
Surepass Production Public Key	Link	https://cdn.surepass.app/public-keys/surepass-production-at-surepass.app-public-key.pem
Surepass Sandbox Public Key	Link	https://cdn.surepass.app/public-keys/surepass-sandbox-at-surepass.app-public-key.pem
Security Best Practices
🔒 Security Guidelines
Never log private keys or decrypted sensitive data
Validate certificates during HTTPS requests
Use secure key storage (environment variables, key vaults)
Rotate keys regularly as advised by Surepass
Implement proper error handling without exposing sensitive information







RC Owner History


curl --location 'https://sandbox.surepass.io/api/v1/rc/rc-owner-history' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data '{
    "id_number": "GJ01RV8123"
}'

Sample Response

{
    "data": {
        "client_id": "rc_owner_history_fItRxcCeVoihtfxjggcF",
        "rc_number": "GJ01RV8123",
        "current_owner_number": "3",
        "current_owner_name": "MAHAMMADALI",
        "owner_history": [
            {
                "owner_name": "HEMPREET SINGH BAJAJ",
                "owner_number": "1"
            },
            {
                "owner_name": "VARUNKUMAR DINESHKUMAR GADHAVI",
                "owner_number": "2"
            },
            {
                "owner_name": "MAHAMMADALI",
                "owner_number": "3"
            }
        ]
    },
    "status_code": 200,
    "success": true,
    "message": null,
    "message_code": "success"
}



for curl GSTIN

--location 'https://sandbox.surepass.io/api/v1/corporate/gstin' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data '{
	"id_number": "08AKWPJ1234H1ZN"
}'


Sample Response
{
    "data": {
        "address_details": {},
        "client_id": "corporate_gstin_hemuprVyNGvtQAvRJHXy",
        "gstin": "08AKWPJ1234H1ZN",
        "pan_number": "AKWPJ1234H",
        "business_name": "MINDA MARWAR PRODUCER COMPANY",
        "legal_name": "MADAN LAL JAT",
        "center_jurisdiction": "Commissionerate - JODHPUR,Division - GST DIVISION",
        "state_jurisdiction": "State - Rajasthan,Zone",
        "date_of_registration": "2021-10-20",
        "constitution_of_business": "Proprietorship",
        "taxpayer_type": "Regular",
        "gstin_status": "Active",
        "date_of_cancellation": "1800-01-01",
        "field_visit_conducted": "No",
        "nature_bus_activities": [
            "Retail Business",
            "Wholesale Business"
        ],
        "nature_of_core_business_activity_code": "NA",
        "nature_of_core_business_activity_description": "NA",
        "aadhaar_validation": "Yes",
        "aadhaar_validation_date": "2021-10-20",
        "filing_status": [],
        "address": "MINDA NAVA, WARD NO. 15, VILL. BHEEVPURA",
        "hsn_info": {},
        "filing_frequency": []
    },
    "status_code": 200,
    "success": true,
    "message": null,
    "message_code": "success"
}

RC V2

curl --location 'https://sandbox.surepass.app/api/v1/rc/rc-v2' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data-raw '{
    "id_number": "DL08AB1234",
    "enrich": true
}'

Sample Response  
{
  "data": {
    "client_id": "rc_v2_tzomotgoEEkXGfksyLav",
    "rc_number": "DL08AB1234",
    "fit_up_to": "2032-12-15",
    "registration_date": "2018-01-20",
    "owner_name": "R***N K****R",
    "father_name": "",
    "present_address": "New Delhi, 110034",
    "permanent_address": "New Delhi, 110034",
    "mobile_number": "",
    "vehicle_category": "2WN",
    "vehicle_chasi_number": "ME3XYZAB1JK456789",
    "vehicle_engine_number": "XYZAB1JK0*****",
    "maker_description": "HONDA MOTORCYCLE & SCOOTER INDIA PVT LTD",
    "maker_model": "ACTIVA 5G",
    "body_type": "SCOOTER",
    "fuel_type": "PETROL",
    "color": "BLACK",
    "norms_type": "BS4",
    "financer": "",
    "financed": false,
    "insurance_company": "ICICI Lombard General Insurance Co. Ltd.",
    "insurance_policy_number": "IC1234567890",
    "insurance_upto": "2025-12-20",
    "manufacturing_date": "12/2017",
    "manufacturing_date_formatted": "2017-12",
    "registered_at": "DELHI, Delhi",
    "latest_by": "2025-08-29",
    "less_info": true,
    "tax_upto": "2032-12-15",
    "tax_paid_upto": "2032-12-15",
    "cubic_capacity": "109.19",
    "vehicle_gross_weight": "0",
    "no_cylinders": "1",
    "seat_capacity": "2",
    "sleeper_capacity": null,
    "standing_capacity": null,
    "wheelbase": null,
    "unladen_weight": "109",
    "vehicle_category_description": "Scooter(2WN)",
    "pucc_number": "DL009876543210",
    "pucc_upto": "2025-11-25",
    "permit_number": "",
    "permit_issue_date": null,
    "permit_valid_from": null,
    "permit_valid_upto": null,
    "permit_type": "",
    "national_permit_number": "",
    "national_permit_upto": null,
    "national_permit_issued_by": null,
    "non_use_status": null,
    "non_use_from": null,
    "non_use_to": null,
    "blacklist_status": "",
    "noc_details": "",
    "owner_number": "1",
    "rc_status": null,
    "rto_code": null,
    "response_metadata": {
      "masked_chassis": true,
      "masked_engine": true,
      "masked_owner_name": true
    }
  },
  "status_code": 200,
  "success": true,
  "message": null,
  "message_code": "success"
}


Chassis To RC
curl --location 'https://sandbox.surepass.io/api/v1/rc/chassis-to-rc-details' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data '{
    "chassis_number": "MALBM51ABC123456"
}'

Sample Response
{
    "data": {
        "client_id": "chassis_to_rc_details_gGDVygwiMPwdRfYbVoyZ",
        "rc_number": "PB00AZ1234",
        "vehicle_chasi_number": "MALBM51ABC123456",
        "details": {
            "rc_number": "PB00AZ1234",
            "fit_up_to": "2034-01-25",
            "registration_date": "2019-01-26",
            "owner_name": "TARSEM SINGH",
            "father_name": "BALVIR SINGH",
            "present_address": "VILLAGE, FIROZPUR,142044",
            "permanent_address": "VILLAGE,CHAK ,FIROZPUR,142044",
            "mobile_number": "",
            "vehicle_category": "LMV",
            "vehicle_chasi_number": "MALBM51ABC123456",
            "vehicle_engine_number": "D4FCJM12345",
            "maker_description": "HYUNDAI MOTOR INDIA LTD",
            "maker_model": "I20 SPORTZ CRDI",
            "body_type": "HATCHBACK",
            "fuel_type": "DIESEL",
            "color": "POLAR WHITE 2",
            "norms_type": "BHARAT STAGE IV",
            "financer": "",
            "financed": false,
            "insurance_company": "HDFC ERGO General Insurance Company Ltd",
            "insurance_policy_number": "230123456000000",
            "insurance_upto": "2025-01-20",
            "manufacturing_date": "10/2018",
            "manufacturing_date_formatted": "2018-10",
            "registered_at": "FEROZPUR RTA, Punjab",
            "latest_by": "2024-01-31",
            "less_info": true,
            "tax_upto": null,
            "tax_paid_upto": "2034-01-25",
            "cubic_capacity": "1396.00",
            "vehicle_gross_weight": "1630",
            "no_cylinders": "4",
            "seat_capacity": "5",
            "sleeper_capacity": "0",
            "standing_capacity": "0",
            "wheelbase": "2570",
            "unladen_weight": "1161",
            "vehicle_category_description": "Motor Car(LMV)",
            "pucc_number": null,
            "pucc_upto": null,
            "permit_number": "",
            "permit_issue_date": null,
            "permit_valid_from": null,
            "permit_valid_upto": null,
            "permit_type": "",
            "national_permit_number": "",
            "national_permit_upto": null,
            "national_permit_issued_by": "",
            "non_use_status": null,
            "non_use_from": null,
            "non_use_to": null,
            "blacklist_status": "",
            "noc_details": "",
            "owner_number": "2",
            "rc_status": "ACTIVE",
            "masked_name": false,
            "challan_details": null,
            "variant": null
        }
    },
    "status_code": 200,
    "success": true,
    "message": null,
    "message_code": "success"
}


AADHAAR VALIDATION

curl --location 'https://sandbox.surepass.io/api/v1/aadhaar-validation/aadhaar-validation' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TOKEN' \
--data '{
    "id_number": "917646971298"
}'

Sample Response
{
    "data": {
        "client_id": "aadhaar_validation_DrkubmqOomYGMmWlvUmt",
        "age_range": "20-30",
        "aadhaar_number": "917646971298",
        "state": "Gujarat",
        "gender": "M",
        "last_digits": "329",
        "is_mobile": true,
        "remarks": "success",
        "less_info": false
    },
    "status_code": 200,
    "success": true,
    "message": null,
    "message_code": "success"
}


PAN Comprehensive

curl --location 'https://kyc-api.surepass.io/api/v1/pan/pan-comprehensive' \
--header 'Authorization: Bearer TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "id_number": "EKRPR1234F"
}'

sample responce
{
  "data": {
    "client_id": "pan_comprehensive_NZAOcvheHYtwohtkWQbH",
    "pan_number": "EKRPR1234F",
    "full_name": "MR. RATHORE",
    "full_name_split": [
      "MR",
      "",
      "RATHORE"
    ],
    "masked_aadhaar": "XXXXXXXX1234",
    "address": {
      "line_1": "A 000 ",
      "line_2": "Jagatpura",
      "street_name": "S.O",
      "zip": 123456,
      "city": "Jaipur",
      "state": "RAJASTHAN",
      "country": "INDIA",
      "full": "A 000 RAJASTHAN INDIA"
    },
    "email": "RATHORE@GMAIL.COM",
    "phone_number": "1234567810",
    "gender": "M",
    "dob": "0001-07-00",
    "input_dob": null,
    "aadhaar_linked": true,
    "dob_verified": false,
    "dob_check": false,
    "category": "person",
    "less_info": false
  },
  "status_code": 200,
  "success": true,
  "message": null,
  "message_code": "success"
}

EMAIL CHECK

curl --location 'https://sandbox.surepass.io/api/v1/employment/email-check' \
--header 'Authorization: Bearer TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "vishalrathore9965@gmail.com"
}'

Sample responce 

{
    "data": {
        "client_id": "email_check_PUTbQENdjpuytwsZLmnh",
        "email": "vishalrathore9965@gmail.com",
        "status": "safe",
        "valid": true,
        "valid_syntax": true,
        "accepts_mail": true,
        "results": true,
        "smtp_connected": true,
        "domain": "gmail.com",
        "domain_age": null,
        "domain_registrar": null,
        "username": "vishalrathore9965",
        "disabled": false,
        "organization": null,
        "organization_mactch": null,
        "person_match": null,
        "is_temporary": false,
        "is_catch_all": false,
        "mx_records": [
            "alt2.gmail-smtp-in.l.google.com.",
            "alt1.gmail-smtp-in.l.google.com.",
            "gmail-smtp-in.l.google.com.",
            "alt4.gmail-smtp-in.l.google.com.",
            "alt3.gmail-smtp-in.l.google.com."
        ]
    },
    "status_code": 200,
    "success": true,
    "message": "Success",
    "message_code": "success"
}