import os

import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

if not firebase_admin._apps:
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if not service_account_path:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is not configured")

    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)


def verify_token(id_token: str):
    return auth.verify_id_token(id_token)