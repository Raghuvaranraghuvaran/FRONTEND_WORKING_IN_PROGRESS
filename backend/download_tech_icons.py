import os
import urllib.request

tech_dir = os.path.abspath(os.path.join("screenshots", "tech_stack"))
os.makedirs(tech_dir, exist_ok=True)

logos = {
    "react.png": "https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.png",
    "python.png": "https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.png",
    "django.png": "https://raw.githubusercontent.com/devicons/devicon/master/icons/django/django-plain.png",
    "postgresql.png": "https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.png",
    "redis.png": "https://raw.githubusercontent.com/devicons/devicon/master/icons/redis/redis-original.png",
}

for name, url in logos.items():
    dest = os.path.join(tech_dir, name)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp, open(dest, 'wb') as out:
            out.write(resp.read())
        print(f"Downloaded: {name} ({os.path.getsize(dest)} bytes)")
    except Exception as e:
        print(f"Failed {name}: {e}")
