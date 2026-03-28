# Command to run: 
#   source .venv/bin/activate
#   python3 ./create-release.py
# Description:
#   1. Copies the backstory-generator folders and files from the root folder to the release folder.
#   2. Zips the backstory-generator folder and copies it to the release folder.
#   3. Tags the git repo with the version from system.json and pushes the tag to origin.
#   4. Creates a new github release, uploading the zip and system.json.

import json
import subprocess

from pathlib import Path
import shutil

from github import Github, Auth
from dotenv import load_dotenv
import os, sys

def run(cmd, **kwargs):
    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True, **kwargs)
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}", file=sys.stderr)
        print(e.stderr.decode() if e.stderr else "", file=sys.stderr)
        raise

# Load .env file
load_dotenv()

source_root = Path("../backstory-generator")
dest = Path("../backstory-generator_release/backstory-generator")
# base_name = dest / "backstory-generator"
backstory_generator_module = json.load(open('module.json', 'r'))

# Make sure destination folder exists
dest.mkdir(parents=True, exist_ok=True)

# Items to copy (with complete replacement)
items = [
    ("scripts", True),     # True == it's a directory
    ("styles", True),
    ("templates", True),
    ("LICENSE", False),
    ("README.md", False),
    ("module.json", False),
    ("system-configurations.md", False),
]

for name, is_dir in items:
    src = source_root / name
    dst = dest / name
    
    if is_dir:
        # Remove old folder completely if it exists
        if dst.exists():
            shutil.rmtree(dst)
        # Copy fresh copy
        shutil.copytree(src, dst)
    else:
        # For files: overwrite directly
        shutil.copy2(src, dst)

print("Copy complete — folders and files have been copied to the release folder.")

# Finally, zip the whole release folder
shutil.make_archive(
    base_name     = str(dest),
    format        = "zip",
    root_dir      = str(dest),
    dry_run       = False,
    logger        = None,
)
print("Zipping complete.")

# Tag the repo in git
version = backstory_generator_module['version']
tag = f"v{version}"
# Only create tag if it doesn't exist
existing_tags = subprocess.check_output(["git", "tag", "--list", tag]).decode().strip()
if not existing_tags:
    run(["git", "tag", "-a", tag, "-m", f"Release {tag}"])
    run(["git", "push", "origin", tag])
    print(f"Created and pushed tag {tag}")
else:
    print(f"Tag {tag} already exists — skipping tag creation")

# Create a new github release and upload the zip and system.json
github_token = os.getenv("GITHUB_TOKEN")
if not github_token:
    raise Exception("GITHUB_TOKEN environment variable not set.")
auth = Auth.Token(github_token)
g = Github(auth=auth)

repo = g.get_repo("thurianknight/backstory-generator")

release_name = f"Release {tag}"
release = repo.create_git_release(tag=tag, name=release_name, message=f"Pre-release of backstory-generator version {version}", draft=False, prerelease=True)

# Upload module.json
module_json_path = source_root / "module.json"
release.upload_asset(str(module_json_path), label="module.json", content_type="application/json")
print("Uploaded module.json to github release.")
# Upload backstory-generator.zip
zip_path = dest.with_suffix('.zip')
release.upload_asset(str(zip_path), label="backstory-generator.zip", content_type="application/zip")
print("Uploaded backstory-generator.zip to github release.")

print("Release creation complete.")
