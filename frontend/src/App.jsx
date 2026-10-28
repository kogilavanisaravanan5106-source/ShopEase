
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  ShoppingCart,
  Search,
  UserRound,
  Menu,
  Star,
  ArrowRight,
  Heart,
} from "lucide-react";
import "./App.css";
import OrderHistory from "./pages/OrderHistory";
import ProductDetails from "./ProductDetails";
import AdminDashboard from "./AdminDashboard";


function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}



function App() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const productsPerPage = 6;
  const categories = [
    "All",
    "Footwear",
    "Accessories",
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty",
  ];

  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [currentPage, setCurrentPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [authMode, setAuthMode] = useState("login");
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopeaseUser")) || null;
    } catch {
      return null;
    }
  });

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const cartPanelRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    axios
      .get("https://shopease-backend-c7sq.onrender.com/api/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch(() => {
        setError("Unable to load products. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesMinPrice =
      minPrice === "" || product.price >= Number(minPrice);

    const matchesMaxPrice =
      maxPrice === "" || product.price <= Number(maxPrice);


    return (
      matchesSearch &&
      matchesCategory &&
      matchesMinPrice &&
      matchesMaxPrice
    );


  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") {
      return a.price - b.price;
    }

    if (sortBy === "price-high") {
      return b.price - a.price;
    }

    if (sortBy === "rating") {
      return b.rating - a.rating;
    }

    return 0;
  });

  const totalPages = Math.ceil(
    sortedProducts.length / productsPerPage
  );

  const startIndex =
    (currentProductPage - 1) * productsPerPage;

  const currentProducts = sortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setCheckoutMessage("");
  }

  function updateQuantity(productId, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setCheckoutMessage("");
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== productId)
    );

    setCheckoutMessage("");
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );





  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    setCheckoutMessage("");

    const token = localStorage.getItem("shopeaseToken");

    if (!token) {
      setCheckoutMessage("Please log in before placing an order.");
      setCheckoutOpen(false);
      setCurrentPage("auth");
      return;
    }

    if (cart.length === 0) {
      setCheckoutMessage("Your cart is empty.");
      return;
    }

    try {
      const items = cart.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      // Keep Cash on Delivery working as before.
      if (paymentMethod === "cod") {
        const response = await axios.post(
          "https://shopease-backend-c7sq.onrender.com/api/orders",
          {
            customer,
            items,
            paymentMethod: "cod",
            totalAmount: cartTotal,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCheckoutMessage(
          `Order placed successfully! Please pay ₹${response.data.order.totalAmount.toLocaleString("en-IN")} when your order arrives. Order ID: ${response.data.order._id}`
        );

        setCart([]);
        setCheckoutOpen(false);
        setCartOpen(true);
        return;
      }

      // Load Razorpay Checkout.
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setCheckoutMessage(
          "Unable to load Razorpay. Please check your internet connection and try again."
        );
        return;
      }

      // Create the payment order on the backend.
      const paymentResponse = await axios.post(
        "https://shopease-backend-c7sq.onrender.com/api/payments/create-order",
        { customer, items },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const paymentData = paymentResponse.data;

      const razorpay = new window.Razorpay({
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "ShopEase",
        description: "ShopEase purchase",
        order_id: paymentData.razorpayOrderId,

        handler: async function (paymentResult) {
          try {
            const verificationResponse = await axios.post(
              "https://shopease-backend-c7sq.onrender.com/api/payments/verify",
              {
                shopOrderId: paymentData.shopOrderId,
                razorpay_order_id: paymentResult.razorpay_order_id,
                razorpay_payment_id: paymentResult.razorpay_payment_id,
                razorpay_signature: paymentResult.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!verificationResponse.data.success) {
              setCheckoutMessage(
                "Payment could not be verified. Please contact support before retrying."
              );
              return;
            }

            setCheckoutMessage(
              `Payment successful! Your order ID is ${paymentData.shopOrderId}.`
            );

            setCart([]);
            setCheckoutOpen(false);
            setCartOpen(true);
          } catch (verificationError) {
            console.error("Payment verification error:", verificationError);

            setCheckoutMessage(
              "We couldn't confirm your payment yet. Please check My Orders before attempting another payment."
            );
          }
        },

        modal: {
          ondismiss: function () {
            setCheckoutMessage(
              "Payment window closed. Your cart is still available."
            );
          },
        },

        theme: {
          color: "#16803d",
        },
      });

      razorpay.on("payment.failed", function (failure) {
        console.error("Razorpay payment failed:", failure.error);

        setCheckoutMessage(
          "Payment failed. Your cart is still available. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);

      setCheckoutMessage(
        error.response?.data?.message ||
        "Unable to continue checkout. Please check that the backend is running."
      );
    }
  }



  async function fetchMyOrders() {
    const token = localStorage.getItem("shopeaseToken");

    if (!token) {
      setOrders([]);
      setOrdersMessage("Please log in to view your orders.");
      return;
    }

    setOrdersLoading(true);
    setOrdersMessage("");

    try {
      const response = await axios.get(
        "https://shopease-backend-c7sq.onrender.com/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Fetch orders error:", error);

      setOrdersMessage(
        error.response?.data?.message ||
        "Unable to load your orders. Please try again."
      );
    } finally {
      setOrdersLoading(false);
    }
  }


  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }


  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "register" : "login";

      const payload =
        authMode === "register"
          ? {
            name: authName,
            email: authEmail,
            password: authPassword,
          }
          : {
            email: authEmail,
            password: authPassword,
          };

      const response = await axios.post(
        `https://shopease-backend-c7sq.onrender.com/api/auth/${endpoint}`,
        payload
      );

      if (authMode === "login") {
        localStorage.setItem("shopeaseToken", response.data.token);
        localStorage.setItem(
          "shopeaseUser",
          JSON.stringify(response.data.user)
        );
        setLoggedInUser(response.data.user);

        setAuthMessage("Login successful!");
        setCurrentPage("home");
        setAuthPassword("");
      } else {
        setAuthMessage("Registration successful! Please log in.");
        setAuthMode("login");
        setAuthPassword("");
      }
    } catch (error) {
      setAuthMessage(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const authInputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    marginTop: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
  };


  return (
    <div className="app">

      <div className="announcement">
        ✨ Welcome to ShopEase — Great finds, everyday prices!
      </div>

      <header className="navbar">
        <a className="logo" href="#">
          Shop<span>Ease.</span>
        </a>

        <nav className="nav-links">
          <a
            href="#home"
            onClick={() => setCurrentPage("home")}
          >
            Home
          </a>

          <a
            href="#products"
            onClick={() => setCurrentPage("home")}
          >
            Products
          </a>

          <a
            href="#categories"
            onClick={() => setCurrentPage("home")}
          >
            Categories
          </a>

          <button
            className="history-link"
            onClick={() => setCurrentPage("orders")}
          >
            My Orders
          </button>

          {loggedInUser?.role === "admin" && (
            <button
              className="history-link"
              onClick={() => setCurrentPage("admin")}
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        <div className="nav-actions">

          <label className="search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setCurrentProductPage(1);

                if (value.trim() !== "") {
                  setTimeout(() => {
                    document.getElementById("products")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 0);
                }
              }}
            />

            {search && (
              <button
                type="button"
                className="clear-search-button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setCurrentProductPage(1);
                }}
              >
                
              </button>
            )}
          </label>





          <button
            className="icon-button account-button"
            aria-label="Account"
            onClick={() => {
              if (loggedInUser) {
                setCurrentPage("account");
              } else {
                setAuthMode("login");
                setAuthMessage("");
                setCurrentPage("auth");
              }
            }}
          >
            <UserRound size={21} />
          </button>





          <button
            className="icon-button cart-button"
            aria-label="Shopping cart"
            onClick={() => {
              setCartOpen(false);
              setCheckoutOpen(false);
              setCurrentPage("cart");
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
          >
            <ShoppingCart size={21} />
            <span className="cart-count">{cartCount}</span>
          </button>


        </div>
      </header>


      {currentPage === "admin" ? (
        <AdminDashboard />
      ) : currentPage === "orders" ? (
        <OrderHistory />
      ) : currentPage === "details" && selectedProduct ? (
        <ProductDetails
          product={selectedProduct}
          onBack={() => {
            setCurrentPage("home");
            window.history.replaceState(null, "", window.location.pathname);
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
          onAddToCart={addToCart}
        />
      ) : null}



      {currentPage === "cart" && (
        <section className="cart-panel" ref={cartPanelRef}>
          <div className="cart-heading">
            <h2>Your Shopping Cart</h2>
            <button
              className="cart-close"
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(false);
                setCurrentPage("home");
                window.scrollTo({ top: 0, behavior: "auto" });
              }}
            >
              Close X
            </button>
          </div>

          {checkoutMessage && (
            <div
              className="checkout-message"
              role="status"
              style={{
                padding: "16px",
                margin: "20px 0",
                backgroundColor: "#dcfce7",
                color: "#166534",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              {checkoutMessage}
            </div>
          )}

          {cart.length === 0 ? (
            <p>Your cart is empty. Add a product to get started!</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item._id}>
                  <img src={item.image} alt={item.name} />

                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    <span>
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>

                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    className="remove-button"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <strong>Total</strong>
                <strong>
                  ₹{cartTotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <button
                className="checkout-button"
                onClick={() => {
                  setCheckoutOpen(true);
                  setCheckoutMessage("");
                }}
              >
                Proceed to checkout
              </button>

              {checkoutOpen && (
                <form
                  className="checkout-form"
                  onSubmit={handleCheckoutSubmit}
                >
                  <h3>Delivery details</h3>

                  <label>
                    Full name
                    <input
                      type="text"
                      required
                      value={customer.fullName}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit phone number"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          phone: e.target.value,
                        })
                      }
                      placeholder="10-digit phone number"
                    />
                  </label>

                  <label>
                    Delivery address
                    <textarea
                      required
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          address: e.target.value,
                        })
                      }
                      placeholder="House number, street, area"
                      rows={3}
                    />
                  </label>

                  <label>
                    City
                    <input
                      type="text"
                      required
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          city: e.target.value,
                        })
                      }
                      placeholder="Enter your city"
                    />
                  </label>

                  <label>
                    PIN code
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      title="Enter a 6-digit PIN code"
                      value={customer.pincode}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          pincode: e.target.value,
                        })
                      }
                      placeholder="6-digit PIN code"
                    />
                  </label>

                  <div className="checkout-total">


                    <div className="payment-method-section">
                      <h3>Choose payment method</h3>

                      <label className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                        />
                        <span>
                          <strong>Online Payment</strong>
                          <small>UPI, credit/debit cards, net banking and supported wallets</small>
                        </span>
                      </label>

                      <label className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                        />
                        <span>
                          <strong>Cash on Delivery</strong>
                          <small>Pay when your order arrives</small>
                        </span>
                      </label>
                    </div>


                    <span>Order total</span>
                    <strong>
                      ₹{cartTotal.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <button className="checkout-button" type="submit">
                    Review details
                  </button>

                  <button
                    className="cancel-checkout"
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}



      {checkoutMessage && (
        <div
          className="checkout-message"
          role="status"
          style={{
            padding: "16px",
            margin: "20px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          {checkoutMessage}
        </div>
      )}


      <main
        style={{
          display: currentPage === "auth" ? "block" : "none",
          maxWidth: "440px",
          margin: "60px auto",
          padding: "30px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#166534" }}>
          {authMode === "register" ? "Create Account" : "Welcome Back!"}
        </h2>

        <p style={{ textAlign: "center", color: "#6b7280" }}>
          {authMode === "register"
            ? "Join ShopEase and start shopping."
            : "Log in to your ShopEase account."}
        </p>

        <form onSubmit={handleAuthSubmit}>
          {authMode === "register" && (
            <input
              type="text"
              placeholder="Full name"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
              autoComplete="name"
              style={authInputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
            autoComplete="email"
            style={authInputStyle}
          />

          <input
            type="password"
            placeholder="Password (minimum 8 characters)"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={
              authMode === "register" ? "new-password" : "current-password"
            }
            style={authInputStyle}
          />

          {authMessage && (
            <p role="status" style={{ color: "#166534", margin: "12px 0" }}>
              {authMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: "100%",
              padding: "13px",
              marginTop: "12px",
              background: "#15803d",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: authLoading ? "wait" : "pointer",
              fontWeight: "bold",
            }}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "register"
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          {authMode === "register"
            ? "Already have an account?"
            : "New to ShopEase?"}{" "}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "register" ? "login" : "register");
              setAuthMessage("");
              setAuthPassword("");
            }}
            style={{
              border: "none",
              background: "none",
              color: "#15803d",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {authMode === "register" ? "Log in" : "Sign up"}
          </button>
        </p>

        <button
          type="button"
          onClick={() => {
            setCurrentPage("home");
            setAuthMessage("");
          }}
          style={{
            display: "block",
            margin: "10px auto 0",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          Back to shopping
        </button>
      </main>


      <main
        style={{
          display: currentPage === "account" ? "block" : "none",
          width: "calc(100% - 32px)",
          maxWidth: "850px",
          boxSizing: "border-box",
          margin: "40px auto",
          padding: "24px",
          background: "#f8fafc",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >

        <h2
          style={{
            color: "#166534",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          My Account
        </h2>

        <div
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#166534", marginTop: 0 }}>
            👤 My Details
          </h3>

          {loggedInUser && (
            <>
              <p style={{ overflowWrap: "anywhere" }}>
                <strong>Name:</strong> {loggedInUser.name}
              </p>
              <p style={{ overflowWrap: "anywhere" }}>
                <strong>Email:</strong> {loggedInUser.email}
              </p>
            </>
          )}
        </div>


        {loggedInUser && (
          <>


            <div
              style={{
                background: "#ffffff",
                padding: "22px",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ color: "#166534", marginTop: 0 }}>
                ❤️ My Wishlist
              </h3>

              {products.filter((product) =>
                favorites.includes(product._id || product.id)
              ).length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  Your wishlist is empty. Like a product to add it here!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {products
                    .filter((product) =>
                      favorites.includes(product._id || product.id)
                    )
                    .map((product) => (
                      <div
                        key={product._id || product.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: "65px",
                            height: "65px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>

                          <strong
                            onClick={() => {
                              setSelectedProduct(product);
                              setCurrentPage("details");
                              window.history.replaceState(null, "", window.location.pathname);
                              window.scrollTo({ top: 0, behavior: "auto" });
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {product.name}
                          </strong>

                          <p style={{ margin: "6px 0 0", color: "#166534" }}>
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(product._id || product.id)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: "20px",
                          }}
                        >
                          ♥
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        <div
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            marginTop: "20px",
            marginBottom: "20px",
            minWidth: 0,
          }}
        >
          <h3 style={{ color: "#166534", marginTop: 0 }}>
            📦 My Orders
          </h3>

          <button
            type="button"
            onClick={fetchMyOrders}
            disabled={ordersLoading}
            style={{
              padding: "10px 16px",
              background: "#166534",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: ordersLoading ? "wait" : "pointer",
              marginBottom: "16px",
            }}
          >
            {ordersLoading ? "Loading orders..." : "View My Orders"}
          </button>

          {ordersMessage && (
            <p style={{ color: "#dc2626" }}>{ordersMessage}</p>
          )}

          {!ordersLoading && !ordersMessage && orders.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              Click "View My Orders" to check your order history.
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {orders.map((order) => (

              <div
                key={order._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  width: "100%",
                  boxSizing: "border-box",
                  minWidth: 0,
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#ffffff",
                  gap: "4px",
                  overflowWrap: "anywhere",
                }}
              >

                <p style={{ margin: "0 0 8px", overflowWrap: "anywhere" }}>
                  <strong>Order ID:</strong> {order._id}
                </p>

                <p style={{ margin: "0 0 8px" }}>
                  <strong>Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>

                <p style={{ margin: "0 0 8px" }}>
                  <strong>Status:</strong> {order.status}
                </p>

                <p style={{ margin: "0 0 8px" }}>
                  <strong>Items:</strong>
                </p>

                {order.items.map((item, index) => (
                  <p
                    key={`${order._id}-${index}`}
                    style={{ margin: "4px 0", color: "#4b5563" }}
                  >
                    {item.name} × {item.quantity} — ₹
                    {(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                ))}

                <p
                  style={{
                    margin: "12px 0 0",
                    paddingTop: "10px",
                    borderTop: "1px solid #e5e7eb",
                    color: "#166534",
                    fontWeight: "bold",
                  }}
                >
                  Total: ₹{order.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>



        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("shopeaseToken");
            localStorage.removeItem("shopeaseUser");
            setLoggedInUser(null);
            setCurrentPage("home");
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </main>


      <main style={{ display: currentPage === "home" ? "block" : "none" }}>

        {search.trim() === "" && (
          <section className="hero" id="home">
            <div className="hero-content">
              <span className="eyebrow">YOUR STYLE, YOUR WAY</span>
              <h1>
                Find your next
                <br />
                <span>favorite thing.</span>
              </h1>
              <p>
                Discover everyday essentials and timeless finds
                picked just for you.
              </p>
              <a className="primary-button" href="#products">
                Explore products <ArrowRight size={18} />
              </a>
              <div className="hero-note">
                <Star size={17} fill="currentColor" />
                Quality finds. Happy shopping.
              </div>
            </div>

            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000"
                alt="Modern fashion shopping store"
              />
              <div className="floating-card">
                <span>New season</span>
                <strong>Fresh finds are here!</strong>
              </div>
            </div>
          </section>
        )}

        {search.trim() === "" && (
          <section className="benefits" id="categories">
            <div className="category-filters">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-button ${selectedCategory === category ? "active" : ""
                    }`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage("home");
                    document.getElementById("products")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE GOOD STUFF</span>
              <h2>Popular picks</h2>
              <p>Everyday favorites worth discovering.</p>
            </div>
            <span className="product-total">
              {filteredProducts.length} products
            </span>
          </div>

          {loading && <p>Loading products...</p>}
          {error && <p>{error}</p>}


          <div className="sorting-container">
            <label htmlFor="sort-products">Sort products:</label>
            <select
              id="sort-products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>


          <div className="price-filter">
            <label htmlFor="min-price">Min Price (₹)</label>
            <input
              id="min-price"
              type="number"
              placeholder="Min price"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <label htmlFor="max-price">Max Price (₹)</label>
            <input
              id="max-price"
              type="number"
              placeholder="Max price"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <button
              type="button"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              Clear Prices
            </button>
          </div>


          <div className="product-grid">
            {currentProducts.map((product) => (
              <article className="product-card" key={product._id || product.id}>
                <div className="product-image">

                  <img
                    src={product.image}
                    alt={product.name}
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentPage("details");
                      window.history.replaceState(null, "", window.location.pathname);
                      window.scrollTo({ top: 0, behavior: "auto" });
                    }}

                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}

                  />

                  <button

                    className={`favorite-button ${favorites.includes(product.id) ? "favorited" : ""
                      }`}
                    aria-label="Toggle favorite"
                    onClick={() => toggleFavorite(product._id || product.id)}
                  >
                    <Heart
                      size={19}
                      fill={
                        favorites.includes(product._id || product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <div className="product-info">
                  <span className="product-category">
                    {product.category}
                  </span>
                  <h3
                    className="clickable-product-name"
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentPage("details");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {product.name}
                  </h3>

                  <div className="product-rating">
                    <Star size={15} fill="currentColor" />
                    <span>{product.rating}</span>
                  </div>

                  <div className="product-bottom">
                    <strong>
                      ₹{product.price.toLocaleString("en-IN")}
                    </strong>
                    <button
                      className="add-button"
                      onClick={() => addToCart(product)}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>


          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={currentProductPage === 1}
                onClick={() =>
                  setCurrentProductPage((page) => page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {currentProductPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentProductPage === totalPages}
                onClick={() =>
                  setCurrentProductPage((page) => page + 1)
                }
              >
                Next
              </button>
            </div>
          )}


          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <Search size={32} />
              <h3>No products found</h3>
              <p>Try another search term.</p>
            </div>
          )}
        </section>
      </main>

      {currentPage === "home" && (
        <footer className="footer">
          <a className="logo" href="#home">
            Shop<span>Ease.</span>
          </a>
          <p>Your everyday shopping destination.</p>
          <p>© {new Date().getFullYear()} ShopEase. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}

export default App;
