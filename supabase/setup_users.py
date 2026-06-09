#!/usr/bin/env python3
"""
חמ"ל דיווחים - סקריפט הקמה אוטומטי ליצירת משתמשים

שימוש:
  python3 setup_users.py

דרישות:
  - supabase-py: pip install supabase

הערות:
  - צור file ".env" באותה תיקיה עם:
    SUPABASE_URL=https://...
    SUPABASE_KEY=...
  - או הגדר משתנים environment: SUPABASE_URL, SUPABASE_KEY
"""

import os
import sys
import json
from typing import Optional, Dict, Any

# צור את התיקיה אם דרוש
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ עדיין לא התקנת supabase-py")
    print("   התקן עם: pip install supabase")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────
# הגדרות
# ──────────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://rkbqpkahtqbnbqmpvdxd.supabase.co"
)

SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    os.getenv("VITE_SUPABASE_ANON_KEY", "sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF")
)

TEST_PASSWORD = "Test@12345"

# תיאור משתמשים
USERS = [
    {
        "email": "coordinator1@doch.local",
        "password": TEST_PASSWORD,
        "full_name": "הברנז\"ל",
        "role": "coordinator",
        "branch_name": "הברנז\"ל"
    },
    {
        "email": "coordinator2@doch.local",
        "password": TEST_PASSWORD,
        "full_name": "אביחיל",
        "role": "coordinator",
        "branch_name": "אביחיל"
    },
    {
        "email": "coordinator3@doch.local",
        "password": TEST_PASSWORD,
        "full_name": "גן יאשיה",
        "role": "coordinator",
        "branch_name": "גן יאשיה"
    },
    {
        "email": "admin@doch.local",
        "password": TEST_PASSWORD,
        "full_name": "מנהל חמ\"ל",
        "role": "haml",
        "branch_name": None
    }
]

# צבעים
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
NC = '\033[0m'

# ──────────────────────────────────────────────────────────────────────────
# פונקציות
# ──────────────────────────────────────────────────────────────────────────

def colored(text: str, color: str) -> str:
    """הדפס טקסט צבעוני"""
    return f"{color}{text}{NC}"

def log_info(msg: str):
    print(f"{BLUE}ℹ {msg}{NC}")

def log_success(msg: str):
    print(f"{GREEN}✓ {msg}{NC}")

def log_error(msg: str):
    print(f"{RED}✗ {msg}{NC}")

def log_warning(msg: str):
    print(f"{YELLOW}⚠ {msg}{NC}")

def create_supabase_client() -> Optional[Client]:
    """צור client Supabase"""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log_success(f"התחברות ל-Supabase: {SUPABASE_URL}")
        return client
    except Exception as e:
        log_error(f"לא יכול להתחבר ל-Supabase: {e}")
        return None

def get_branch_id(client: Client, branch_name: str) -> Optional[str]:
    """קבל UUID של סניף לפי שם"""
    if not branch_name:
        return None

    try:
        response = client.table('branches').select('id').eq('name', branch_name).execute()
        if response.data:
            return response.data[0]['id']
        log_warning(f"סניף '{branch_name}' לא נמצא בטבלה branches")
        return None
    except Exception as e:
        log_error(f"שגיאה בחפוש סניף '{branch_name}': {e}")
        return None

def create_user(client: Client, email: str, password: str) -> Optional[str]:
    """צור משתמש ב-Supabase Auth, החזר את ה-UUID"""
    try:
        response = client.auth.sign_up({
            "email": email,
            "password": password
        })

        if response.user:
            log_success(f"משתמש {email} נוצר")
            return response.user.id
        else:
            log_error(f"לא קיבלנו user ID עבור {email}")
            return None
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg:
            log_warning(f"משתמש {email} כבר קיים, דילוג")
            # נסה להתחבר כדי לקבל את ה-UUID
            try:
                response = client.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })
                if response.user:
                    return response.user.id
            except:
                pass
            return None
        log_error(f"שגיאה בהרשמת {email}: {e}")
        return None

def create_profile(
    client: Client,
    user_id: str,
    full_name: str,
    role: str,
    branch_id: Optional[str] = None
) -> bool:
    """צור פרופיל עבור משתמש"""
    try:
        client.table('profiles').insert({
            'id': user_id,
            'full_name': full_name,
            'role': role,
            'branch_id': branch_id
        }).execute()
        log_success(f"פרופיל עבור {full_name} ({role}) נוצר")
        return True
    except Exception as e:
        if "duplicate" in str(e).lower() or "already exists" in str(e).lower():
            log_warning(f"פרופיל עבור {full_name} כבר קיים")
            return True
        log_error(f"שגיאה בהוצאת פרופיל {full_name}: {e}")
        return False

def seed_branches(client: Client):
    """צור סניפים בדוקים אם עדיין לא קיימים"""
    branches_to_create = [
        {"name": "הברנז\"ל", "region": "מחוז מרכז", "camp": "מחנה שכב\"ג"},
        {"name": "אביחיל", "region": "מחוז צפון", "camp": "מחנה שכב\"ג"},
        {"name": "גן יאשיה", "region": "מחוז דרום", "camp": "מחנה שכב\"ג"}
    ]

    log_info("בדיקת סניפים בדוקים...")

    for branch in branches_to_create:
        try:
            # בדוק אם קיים
            response = client.table('branches').select('id').eq('name', branch['name']).execute()
            if response.data:
                log_warning(f"סניף '{branch['name']}' כבר קיים")
                continue

            # צור
            client.table('branches').insert(branch).execute()
            log_success(f"סניף '{branch['name']}' נוצר")
        except Exception as e:
            log_error(f"שגיאה בהוצאת סניף '{branch['name']}': {e}")

def main():
    """פונקציה ראשית"""
    print()
    print(colored("═" * 75, BLUE))
    print(colored('  חמ"ל דיווחים - סקריפט יצירת משתמשים בדיקה', BLUE))
    print(colored("═" * 75, BLUE))
    print()

    # צור client
    client = create_supabase_client()
    if not client:
        log_error("לא יכול להתחבר ל-Supabase")
        sys.exit(1)

    print()

    # Seed סניפים
    log_info("שלב 1: עירית סניפים...")
    seed_branches(client)
    print()

    # צור משתמשים
    log_info("שלב 2: יצירת משתמשים...")
    created_users = []

    for user_spec in USERS:
        email = user_spec["email"]
        password = user_spec["password"]
        full_name = user_spec["full_name"]
        role = user_spec["role"]
        branch_name = user_spec.get("branch_name")

        # צור משתמש
        user_id = create_user(client, email, password)
        if not user_id:
            continue

        # קבל branch_id
        branch_id = None
        if branch_name:
            branch_id = get_branch_id(client, branch_name)

        # צור פרופיל
        if create_profile(client, user_id, full_name, role, branch_id):
            created_users.append({
                "email": email,
                "password": password,
                "full_name": full_name,
                "role": role,
                "branch_name": branch_name
            })

    print()

    # הדפס סיכום
    print(colored("═" * 75, GREEN))
    print(colored("  ✓ סיום", GREEN))
    print(colored("═" * 75, GREEN))
    print()

    if created_users:
        print(colored("משתמשים שנוצרו בהצלחה:", GREEN))
        print()
        for user in created_users:
            print(f"  • {user['email']}")
            print(f"    שם: {user['full_name']}")
            print(f"    תפקיד: {user['role']}")
            if user['branch_name']:
                print(f"    סניף: {user['branch_name']}")
            print(f"    סיסמה: {user['password']}")
            print()

    print(colored("פרטים מלאים שמורים ב: supabase/test-users.txt", YELLOW))
    print()

    # שמור תיעוד בקובץ
    try:
        with open(os.path.join(os.path.dirname(__file__), 'test-users.txt'), 'w', encoding='utf-8') as f:
            f.write("╔════════════════════════════════════════════════════════════════════════════╗\n")
            f.write("║                   חמ\"ל דיווחים — משתמשי בדיקה                           ║\n")
            f.write("╚════════════════════════════════════════════════════════════════════════════╝\n\n")

            for user in created_users:
                f.write(f"───────────────────────────────────────────────────────────────────────────\n")
                f.write(f"אימייל:  {user['email']}\n")
                f.write(f"סיסמה:   {user['password']}\n")
                f.write(f"שם:      {user['full_name']}\n")
                f.write(f"תפקיד:   {user['role']}\n")
                if user['branch_name']:
                    f.write(f"סניף:    {user['branch_name']}\n")
                f.write("\n")

        log_success("פרטי משתמש שמורו בקובץ test-users.txt")
    except Exception as e:
        log_warning(f"לא יכול לשמור את פרטי המשתמש: {e}")

    print()
    print(colored("שלב הבא:", YELLOW))
    print("  1. הרץ את התפוקה: npm run dev")
    print("  2. התחבר בעזרת אחד מן המשתמשים")
    print("  3. בדוק RLS - רכז יראה רק את סניפו, חמ\"ל יראה הכל")
    print()

if __name__ == "__main__":
    main()
