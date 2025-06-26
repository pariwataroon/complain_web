import re
import json

def mask_sensitive(data):
    """
    Mask sensitive fields in JSON string or dict.
    Fields: password, token, api_key, key, secret, pin, authorization, x-api-key, x-auth-token
    """
    sensitive_keys = [
        "password", "token", "api_key", "apikey", "key", "secret", "pin",
        "authorization", "x-api-key", "x-auth-token", "thaid_token"
    ]
    # ถ้าเป็น string ที่เป็น JSON
    if isinstance(data, str):
        try:
            obj = json.loads(data)
            masked = mask_sensitive(obj)
            return json.dumps(masked, ensure_ascii=False)
        except Exception:
            # ถ้าไม่ใช่ JSON, ใช้ regex แทน
            for key in sensitive_keys:
                # mask แบบ key":"value"
                data = re.sub(
                    rf'("{key}"\s*:\s*")([^"]+)(")', 
                    rf'\1[FILTERED]\3', 
                    data, flags=re.IGNORECASE
                )
            return data
    # ถ้าเป็น dict
    elif isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            if any(s in k.lower() for s in sensitive_keys):
                masked[k] = "[FILTERED]"
            elif isinstance(v, (dict, list, str)):
                masked[k] = mask_sensitive(v)
            else:
                masked[k] = v
        return masked
    # ถ้าเป็น list
    elif isinstance(data, list):
        return [mask_sensitive(item) for item in data]
    else:
        return data