
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Package,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api/orders";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("shopeaseToken");

      const response = await axios.get(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load orders. Please log in as an admin."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      setError("");

      const token = localStorage.getItem("shopeaseToken");

      const response = await axios.patch(
        `${API_URL}/admin/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId ? response.data.order : order
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update order status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "Paid")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const activeOrders = orders.filter(
    (order) =>
      !["Delivered", "Cancelled"].includes(order.status)
  ).length;

  const filteredOrders =
    statusFilter === "All"
      ? orders
      : orders.filter(
        (order) => order.status === statusFilter
      );

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <ShieldCheck size={30} />
          <div>
            <h1>ShopEase Admin</h1>
            <p>Store management dashboard</p>
          </div>
        </div>

        <button className="admin-refresh" onClick={fetchOrders}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-welcome">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h2>Order Management</h2>
          <p>Monitor customer purchases and delivery progress.</p>
        </div>
        <LayoutDashboard size={48} />
      </section>

      <section className="admin-stats">
        <article className="admin-stat">
          <Package size={24} />
          <p>Total orders</p>
          <h3>{orders.length}</h3>
        </article>

        <article className="admin-stat">
          <RefreshCw size={24} />
          <p>Active orders</p>
          <h3>{activeOrders}</h3>
        </article>

        <article className="admin-stat">
          <IndianRupee size={24} />
          <p>Paid revenue</p>
          <h3>₹{totalRevenue.toLocaleString("en-IN")}</h3>
        </article>
      </section>

      <div className="admin-filter">
        <label htmlFor="status-filter">Filter orders:</label>

        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Orders</option>
          <option value="Placed">Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <section className="admin-orders-section">
        <div className="admin-section-heading">
          <div>
            <h2>Customer Orders</h2>
            <p>Review orders and update their status.</p>
          </div>
          <span>{orders.length} orders</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="admin-empty">
            {statusFilter === "All"
              ? "No customer orders found."
              : `No ${statusFilter.toLowerCase()} orders found.`}
          </div>
        ) : (
          <div className="admin-orders">
            {filteredOrders.map((order) => (
              <article className="admin-order-card" key={order._id}>
                <div className="admin-order-top">
                  <div>
                    <span className="admin-order-label">ORDER ID</span>
                    <h3>{order._id}</h3>
                    <p>
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <span
                    className={`admin-status status-${order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="admin-order-details">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {order.customer?.fullName || order.user?.name || "Customer"}
                    </strong>
                    <p>{order.user?.email || "Email unavailable"}</p>
                  </div>

                  <div>
                    <span>Total amount</span>
                    <strong>
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div>
                    <span>Payment method</span>
                    <strong>
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "Online Payment"}
                    </strong>
                    <p>Payment: {order.paymentStatus || "Not available"}</p>
                  </div>
                </div>

                <div className="admin-order-items">
                  <strong>Products</strong>
                  {order.items?.map((item, index) => (
                    <p key={`${order._id}-${index}`}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </div>

                <div className="admin-status-control">
                  <label htmlFor={`status-${order._id}`}>
                    Update order status
                  </label>

                  <select
                    id={`status-${order._id}`}
                    value={order.status}
                    disabled={
                      updatingId === order._id ||
                      ["Cancelled", "Delivered"].includes(order.status)
                    }
                    onChange={(event) =>
                      updateStatus(order._id, event.target.value)
                    }
                  >
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  {updatingId === order._id && <span>Saving...</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
