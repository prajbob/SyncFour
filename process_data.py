import pandas as pd

df = pd.read_csv("crop_production.csv")

# Map states to regions
region_map = {
    "north": ["Uttar Pradesh", "Punjab", "Haryana", "Himachal Pradesh", "Uttarakhand", "Jammu and Kashmir"],
    "south": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"],
    "east": ["West Bengal", "Odisha", "Jharkhand", "Bihar"],
    "west": ["Rajasthan", "Gujarat", "Maharashtra"],
    "central": ["Madhya Pradesh", "Chhattisgarh"],
    "northeast": ["Assam", "Manipur", "Meghalaya", "Nagaland", "Tripura", "Mizoram", "Arunachal Pradesh"]
}

for region, states in region_map.items():
    region_df = df[df["State_Name"].isin(states)]
    recent = region_df[region_df["Crop_Year"] >= 2010]
    avg_production = recent["Production"].mean()
    print(f"{region}: avg_production = {avg_production:.0f}, records = {len(recent)}")