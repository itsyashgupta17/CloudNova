
import { useState, useEffect } from "react";

function Storage() {
  const [buckets, setBuckets] = useState([]);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");

  const API = "http://127.0.0.1:8000";

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
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Storage Management</h1>
      <p>Create and manage your cloud storage buckets.</p>

      {/* Storage Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          margin: "25px 0",
        }}
      >
        <div
          style={{
            background: "#252b3b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <p>Total Buckets</p>
          <h1>{buckets.length}</h1>
        </div>

        <div
          style={{
            background: "#252b3b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <p>Total Storage Capacity</p>
          <h1>{totalStorage} GB</h1>
        </div>

        <div
          style={{
            background: "#252b3b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <p>Average Bucket Size</p>
          <h1>{averageStorage} GB</h1>
        </div>
      </div>

      {/* Create Bucket Form */}
      <form onSubmit={createBucket}>
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

        <button type="submit">Create Bucket</button>
      </form>

      {message && <p>{message}</p>}

      <h2>Your Storage Buckets</h2>

      {buckets.length === 0 ? (
        <p>No storage buckets found.</p>
      ) : (
        buckets.map((bucket) => (
          <div
            key={bucket.id}
            style={{
              padding: "15px",
              margin: "10px 0",
              background: "#252b3b",
              borderRadius: "8px",
            }}
          >
            <strong>{bucket.name}</strong>
            <p>Capacity: {bucket.size_gb} GB</p>

            <button onClick={() => deleteBucket(bucket.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Storage;
