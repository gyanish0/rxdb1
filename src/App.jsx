import React, { useEffect, useState } from "react";
import { getDatabase } from "./db";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [db, setDb] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [articles, setArticles] = useState([]);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newArticle, setNewArticle] = useState({
    name: "",
    qty: "",
    selling_price: "",
    business_id: "",
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState("businesses");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function setupDb() {
      const database = await getDatabase();
      setDb(database);

      database.businesses.find().$.subscribe((docs) => {
        setBusinesses(docs.map((doc) => doc.toJSON()));
      });

      database.articles.find().$.subscribe((docs) => {
        setArticles(docs.map((doc) => doc.toJSON()));
      });
    }
    setupDb();

    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const syncWithMongoDB = async () => {
    if (!isOnline || !db) return;

    setIsSyncing(true);
    try {
      const unsyncedBusinesses = await db.businesses.find().exec();
      const unsyncedArticles = await db.articles.find().exec();

      const businessData = unsyncedBusinesses.map((doc) => doc.toJSON());
      const articleData = unsyncedArticles.map((doc) => doc.toJSON());

      const response = await fetch("URL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businesses: businessData,
          articles: articleData,
        }),
      });

      if (!response.ok) throw new Error("Sync failed");
      console.log("Data synced to MongoDB Atlas:", await response.json());
    } catch (error) {
      console.error("Error syncing with MongoDB Atlas:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddBusiness = async () => {
    if (!newBusinessName || !db) return;
    const business = {
      id: uuidv4(),
      name: newBusinessName,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.businesses.insert(business);
      setNewBusinessName("");
      if (isOnline) syncWithMongoDB();
    } catch (error) {
      console.error("Error adding business:", error);
    }
  };

  const handleAddArticle = async () => {
    if (!newArticle.name || !newArticle.qty || !newArticle.selling_price || !newArticle.business_id || !db) {
      alert("Please fill all article fields!");
      return;
    }
    const article = {
      id: uuidv4(),
      name: newArticle.name,
      qty: parseInt(newArticle.qty),
      selling_price: parseFloat(newArticle.selling_price),
      business_id: newArticle.business_id,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.articles.insert(article);
      setNewArticle({ name: "", qty: "", selling_price: "", business_id: "" });
      if (isOnline) syncWithMongoDB();
    } catch (error) {
      console.error("Error adding article:", error);
    }
  };

  const deleteBusiness = async (id) => {
    if (!db) return;
    try {
      await db.businesses.findOne(id).remove();
      if (isOnline) syncWithMongoDB();
    } catch (error) {
      console.error("Error deleting business:", error);
    }
  };

  const deleteArticle = async (id) => {
    if (!db) return;
    try {
      await db.articles.findOne(id).remove();
      if (isOnline) syncWithMongoDB();
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Business & Articles Manager</h1>
          <div className={`status-badge ${isOnline ? "online" : "offline"}`}>
            {isOnline ? (
              <>
                <span className="status-dot"></span> Online
              </>
            ) : (
              <>
                <span className="status-dot"></span> Offline
              </>
            )}
          </div>
        </div>
        <p className="header-subtitle">An offline-first CRUD application with MongoDB sync</p>
      </header>

      <main className="app-main">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "businesses" ? "active" : ""}`}
            onClick={() => setActiveTab("businesses")}
          >
            Businesses
          </button>
          <button
            className={`tab-button ${activeTab === "articles" ? "active" : ""}`}
            onClick={() => setActiveTab("articles")}
          >
            Articles
          </button>
          <button
            className="sync-button"
            onClick={syncWithMongoDB}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>

        {activeTab === "businesses" && (
          <div className="tab-content">
            <section className="form-section card">
              <h2 className="section-title">Add New Business</h2>
              <div className="form-group">
                <label htmlFor="business-name">Business Name</label>
                <input
                  type="text"
                  id="business-name"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="form-input"
                />
              </div>
              <button
                className="primary-button"
                onClick={handleAddBusiness}
                disabled={!newBusinessName}
              >
                Add Business
              </button>
            </section>

            <section className="list-section card">
              <h2 className="section-title">Your Businesses</h2>
              {businesses.length === 0 ? (
                <p className="empty-state">No businesses added yet.</p>
              ) : (
                <div className="business-grid">
                  {businesses.map((business) => (
                    <div key={business.id} className="business-card">
                      <div className="business-header">
                        <h3>{business.name}</h3>
                        <button
                          className="delete-button"
                          onClick={() => deleteBusiness(business.id)}
                        >
                          &times;
                        </button>
                      </div>
                      <div className="business-meta">
                        <span>Created: {new Date(business.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="articles-preview">
                        <h4>Articles ({articles.filter(a => a.business_id === business.id).length})</h4>
                        {articles.filter(a => a.business_id === business.id).length > 0 ? (
                          <ul>
                            {articles
                              .filter(a => a.business_id === business.id)
                              .slice(0, 3)
                              .map(article => (
                                <li key={article.id}>{article.name}</li>
                              ))}
                            {articles.filter(a => a.business_id === business.id).length > 3 && (
                              <li>+{articles.filter(a => a.business_id === business.id).length - 3} more</li>
                            )}
                          </ul>
                        ) : (
                          <p className="empty-state">No articles yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "articles" && (
          <div className="tab-content">
            <section className="form-section card">
              <h2 className="section-title">Add New Article</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="article-name">Article Name</label>
                  <input
                    type="text"
                    id="article-name"
                    value={newArticle.name}
                    onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
                    placeholder="Enter article name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="article-qty">Quantity</label>
                  <input
                    type="number"
                    id="article-qty"
                    value={newArticle.qty}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value > 0 || e.target.value === "") {
                        setNewArticle({ ...newArticle, qty: e.target.value });
                      }
                    }}
                    placeholder="Qty"
                    min="0"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="article-price">Selling Price ($)</label>
                  <input
                    type="number"
                    id="article-price"
                    value={newArticle.selling_price}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value > 0 || e.target.value === "") {
                        setNewArticle({ ...newArticle, selling_price: e.target.value });
                      }
                    }}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="business-select">Business</label>
                  <select
                    id="business-select"
                    value={newArticle.business_id}
                    onChange={(e) => setNewArticle({ ...newArticle, business_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Business</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className="primary-button"
                onClick={handleAddArticle}
                disabled={!newArticle.name || !newArticle.qty || !newArticle.selling_price || !newArticle.business_id}
              >
                Add Article
              </button>
            </section>

            <section className="list-section card">
              <h2 className="section-title">All Articles</h2>
              {articles.length === 0 ? (
                <p className="empty-state">No articles added yet.</p>
              ) : (
                <div className="table-container">
                  <table className="articles-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Business</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((article) => {
                        const business = businesses.find(b => b.id === article.business_id);
                        return (
                          <tr key={article.id}>
                            <td>{article.name}</td>
                            <td>{article.qty}</td>
                            <td>${article.selling_price.toFixed(2)}</td>
                            <td>{business ? business.name : "Unknown"}</td>
                            <td>
                              <button
                                className="delete-button small"
                                onClick={() => deleteArticle(article.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Business Manager | Built with React.js & RxDB</p>
      </footer>
    </div>
  );
}

export default App;