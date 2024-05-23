import requests
import json
import argparse


def fetch_issue(issue_number: int):
    url = f"https://api.github.com/repos/OpenModelDB/open-model-database/issues/{issue_number}"
    response = requests.get(url)

    if response.status_code == 200:
        return json.loads(response.content)

    return None


# parse args
parser = argparse.ArgumentParser(
    description="Convert a model request issue from OpenModelDB's GitHub to a model file."
)

parser.add_argument(
    "issue_number", type=int, help="The issue number to fetch the model request from."
)

args = parser.parse_args()

issue = fetch_issue(args.issue_number)
if issue is None:
    print(f"Failed to fetch issue {args.issue_number}")
    exit(1)
issue_body = issue["body"]

if issue_body.startswith("```") and issue_body.endswith("```"):
    issue_body = issue_body[3:-3]

if issue_body.startswith("json"):
    issue_body = issue_body[4:]

issue_body = issue_body.strip()
issue_body = json.loads(issue_body)

issue_title = issue["title"]
model_name = issue_title.replace("[MODEL ADD REQUEST] ", "").replace("-", "_")

models_dir = "./data/models"

with open(f"{models_dir}/{model_name}.json", "w") as f:
    json.dump(issue_body, f, indent=4)
