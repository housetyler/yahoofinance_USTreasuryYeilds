import requests
import datetime
import pandas as pd

# URL to get 1-year daily yield data for ^TNX (10Y Treasury Yield)
url = "https://query1.finance.yahoo.com/v8/finance/chart/^TNX?range=1y&interval=1d"

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
result = data['chart']['result'][0]
timestamps = result['timestamp']
quotes = result['indicators']['quote'][0]

df = pd.DataFrame({
    'Date': [datetime.datetime.fromtimestamp(ts).date() for ts in timestamps],
    'Open': quotes['open'],
    'High': quotes['high'],
    'Low': quotes['low'],
    'Close': quotes['close'],
})

# Drop rows with missing values
df = df.dropna()

# Rename 'Close' to match your existing format
df.rename(columns={'Close': '10 Yr Yield'}, inplace=True)

# Save to CSV
df.to_csv("10yr_yield_history.csv", index=False)
print("✅ Saved 365-day yield history with High and Low.")
