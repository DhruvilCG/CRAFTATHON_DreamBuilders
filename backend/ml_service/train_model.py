import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

FEATURE_COLUMNS = ['packetSize', 'duration', 'frequency', 'protocol']


def generate_mock_dataset(rows=1400):
    print("Generating mock dataset (similar to UNSW-NB15/NSL-KDD features)...")
    np.random.seed(42)
    normal_size = int(rows * 0.88)
    attack_size = rows - normal_size

    normal_data = pd.DataFrame({
        'packetSize': np.random.normal(500, 100, normal_size),
        'duration': np.random.exponential(1, normal_size),
        'frequency': np.random.poisson(10, normal_size),
        'protocol': np.random.choice([0, 1, 2], normal_size, p=[0.7, 0.2, 0.1]),
        'label': 0
    })
    
    attack_data = pd.DataFrame({
        'packetSize': np.random.normal(3000, 500, attack_size),
        'duration': np.random.exponential(10, attack_size),
        'frequency': np.random.poisson(100, attack_size),
        'protocol': np.random.choice([0, 1, 2], attack_size),
        'label': 1
    })
    
    dataset = pd.concat([normal_data, attack_data], ignore_index=True)
    return dataset


def preprocess_dataset(dataset):
    protocol_map = {'TCP': 0, 'UDP': 1, 'ICMP': 2, 'OTHER': 3}

    if 'protocol' in dataset.columns and dataset['protocol'].dtype == object:
        dataset['protocol'] = dataset['protocol'].fillna('OTHER').astype(str).str.upper().map(protocol_map).fillna(3)

    rename_map = {
        'packet_size': 'packetSize',
        'pkt_size': 'packetSize',
        'flow_duration': 'duration',
        'freq': 'frequency',
    }
    dataset = dataset.rename(columns=rename_map)

    for col in FEATURE_COLUMNS:
        if col not in dataset.columns:
            dataset[col] = 0

    if 'label' not in dataset.columns:
        dataset['label'] = 0

    for col in FEATURE_COLUMNS:
        dataset[col] = pd.to_numeric(dataset[col], errors='coerce').fillna(0)

    dataset['label'] = pd.to_numeric(dataset['label'], errors='coerce').fillna(0)
    dataset['label'] = (dataset['label'] > 0).astype(int)

    return dataset


def load_dataset():
    dataset_paths = os.getenv('DATASET_PATHS', '').strip()
    if not dataset_paths:
        return preprocess_dataset(generate_mock_dataset())

    frames = []
    for path in dataset_paths.split(','):
        csv_path = path.strip()
        if not csv_path:
            continue
        if not os.path.exists(csv_path):
            print(f"Skipping missing dataset path: {csv_path}")
            continue
        print(f"Loading dataset: {csv_path}")
        frames.append(pd.read_csv(csv_path))

    if not frames:
        return preprocess_dataset(generate_mock_dataset())

    merged = pd.concat(frames, ignore_index=True)
    return preprocess_dataset(merged)

def train():
    dataset = load_dataset()
    features = dataset[FEATURE_COLUMNS]
    labels = dataset['label']
    
    print("Training Isolation Forest model...")
    isolation_model = IsolationForest(contamination=0.12, random_state=42)
    isolation_model.fit(features)

    print("Training Random Forest classifier...")
    rf_model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    rf_model.fit(features, labels)
    
    print("Saving trained models...")
    joblib.dump(isolation_model, 'isolation_model.pkl')
    joblib.dump(rf_model, 'rf_model.pkl')
    joblib.dump(isolation_model, 'model.pkl')
    print("Model artifacts: isolation_model.pkl, rf_model.pkl, model.pkl")
    print("✅ Models trained and saved successfully.")

if __name__ == '__main__':
    train()
