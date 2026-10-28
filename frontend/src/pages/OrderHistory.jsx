
import { useEffect, useState } from "react";
import axios from "axios";
import "./OrderHistory.css";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("shopeaseToken");

    try {
      const response = await axios.patch(
        `https://shopease-backend-c7sq.onrender.com/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId ? response.data.order : order
        )
      );
    } catch (err) {
      console.error("Cancel order error:", err);

      window.alert(
        err.response?.data?.message || "Unable to cancel this order."
      );
    }
  };


  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem("shopeaseToken");

        const response = await axios.get(
          "https://shopease-backend-c7sq.onrender.com/api/orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Unable to load orders. Please check your backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="order-history"><p>Loading your orders...</p></div>;
  }

  if (error) {
    return <div className="order-history"><p>{error}</p></div>;
  }

  return (
    <div className="order-history">
      <h1>My Orders</h1>
      <p className="order-subtitle">
        Track your ShopEase purchases in one place.
      </p>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <h2>No orders yet</h2>
          <p>Your purchases will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <span className="order-label">Order ID</span>
                  <p className="order-id">{order._id}</p>
                </div>

                <span className="order-status">{order.status}</span>
              </div>


              {order.status === "Cancelled" ? (
                <p className="tracking-cancelled">
                  Order Cancelled
                </p>
              ) : (
                <div className="order-tracking">
                  {["Placed", "Processing", "Shipped", "Delivered"].map(
                    (step, index) => {
                      const statuses = [
                        "Placed",
                        "Processing",
                        "Shipped",
                        "Delivered",
                      ];

                      const currentStep = statuses.indexOf(order.status);

                      return (
                        <div
                          key={step}
                          className={`tracking-step ${index <= currentStep ? "completed" : ""
                            }`}
                        >
                          <span className="tracking-dot">
                            {index < currentStep ? "✓" : index + 1}
                          </span>
                          <span className="tracking-label">{step}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}


              <div className="order-details">
                <p>
                  <strong>Placed on:</strong>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>

                <p>
                  <strong>Customer:</strong> {order.customer.fullName}
                </p>

                <p>
                  <strong>Items:</strong> {order.items.length} product type(s)
                </p>

                <p>
                  <strong>Total:</strong>{" "}
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </p>

                <p>
                  <strong>Payment method:</strong>{" "}
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod === "online"
                      ? "Online Payment"
                      : "Not available"}
                </p>

                <p>
                  <strong>Payment status:</strong>{" "}
                  {order.paymentStatus || "Not available"}
                </p>
              </div>

              <div className="ordered-products">
                <h3>Products</h3>

                {order.items.map((item, index) => (
                  <div
                    className="ordered-product"
                    key={`${order._id}-${index}`}
                  >
                    <span>{item.name} × {item.quantity}</span>
                    <strong>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>


              {order.status === "Placed" && (
                <button
                  className="cancel-order-button"
                  onClick={() => handleCancelOrder(order._id)}
                >
                  Cancel Order
                </button>
              )}


            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
