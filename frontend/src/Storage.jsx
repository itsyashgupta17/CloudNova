import { useState, useEffect } from "react";
import { API_BASE_URL } from "./config";

function Storage() {
  const [buckets, setBuckets] = useState([]);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");

  const API = API_BASE_URL;

  // Get the logged-in user's token.
  const getAuthHeaders = () => {
    const token = localStorage.getItem("cloudnova_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch storage buckets.
  const fetchBuckets = async () => {
    try {
      const response = await fetch(`${API}/storage/buckets`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch buckets");
      }

      setBuckets(data);
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend");
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  const totalStorage = buckets.reduce(
    (total, bucket) => total + Number(bucket.size_gb),
    0
  );

  const averageStorage = buckets.length
    ? (totalStorage / buckets.length).toFixed(1)
    : 0;

  // Create a storage bucket.
  const createBucket = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/storage/buckets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: name.trim(),
          size_gb: Number(size),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Failed to create bucket");
        return;
      }

      setMessage("Storage bucket created successfully!");
      setName("");
      setSize("");
      await fetchBuckets();
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend");
    }
  };

  // Delete a storage bucket.
  const deleteBucket = async (id) => {
    if (!window.confirm("Delete this storage bucket?")) return;

    setMessage("");

    try {
      const response = await fetch(
        `${API}/storage/buckets/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.detail || "Failed to delete bucket");
        return;
      }

      setMessage("Bucket deleted successfully!");
      await fetchBuckets();
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend");
    }
  };

  return (
    <div className="storage-container">
      <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: "8px" }}>
        Storage Management
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
        Create and manage your cloud storage buckets.
      </p>

      {/* Storage Statistics */}
      <div className="storage-stats-grid">
        <div className="storage-stat-card">
          <p>Total Buckets</p>
          <h1>{buckets.length}</h1>
        </div>

        <div className="storage-stat-card">
          <p>Total Storage Capacity</p>
          <h1>{totalStorage} GB</h1>
        </div>

        <div className="storage-stat-card">
          <p>Average Bucket Size</p>
          <h1>{averageStorage} GB</h1>
        </div>
      </div>

      {/* Create Bucket Form */}
      <form onSubmit={createBucket} className="storage-form-card">
        <input
          placeholder="Bucket name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Size in GB"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          min="1"
          required
        />

        <button type="submit" className="create-btn">
          Create Bucket
        </button>
      </form>

      {message && (
        <p style={{ color: "#38bdf8", marginBottom: "16px" }}>
          {message}
        </p>
      )}

      <h2 style={{ fontSize: "clamp(18px, 2.5vw, 22px)", margin: "24px 0 14px" }}>
        Your Storage Buckets
      </h2>

      {buckets.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No storage buckets found.</p>
      ) : (
        buckets.map((bucket) => (
          <div key={bucket.id} className="storage-bucket-item">
            <div className="storage-bucket-info">
              <strong>{bucket.name}</strong>
              <p>Capacity: {bucket.size_gb} GB</p>
            </div>

            <button
              className="delete-btn"
              onClick={() => deleteBucket(bucket.id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Storage;
