import requests
import datetime
import pandas as pd

# URL to get 1-year daily yield data for ^TNX (10Y Treasury Yield)
url = "https://query1.finance.yahoo.com/v8/finance/chart/^TNX?range=1y&interval=1d"

# Spoof browser headers to avoid being blocked
headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)

# Ensure request was successful
if response.status_code != 200:
    print(f"❌ Request failed with status {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()

timestamps = data['chart']['result'][0]['timestamp']
closes = data['chart']['result'][0]['indicators']['quote'][0]['close']

df = pd.DataFrame({
    'Date': [datetime.datetime.fromtimestamp(ts).date() for ts in timestamps],
    '10 Yr Yield': closes
})

# Drop rows with missing values
df = df.dropna()

# Save to CSV
df.to_csv("10yr_yield_history.csv", index=False)
print("✅ Saved 365-day yield history.")
