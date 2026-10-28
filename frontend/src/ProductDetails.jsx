
import { ArrowLeft, Star, ShoppingCart } from "lucide-react";
import "./ProductDetails.css";

function ProductDetails({ product, onBack, onAddToCart }) {
  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <section className="product-details-page">
      <button className="details-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to shopping
      </button>

      <div className="details-layout">
        <div className="details-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-info">
          <span className="details-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          <div className="details-rating">
            <Star size={18} fill="currentColor" />
            <span>{product.rating}</span>
          </div>

          <h2>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </h2>

          <p>
            Discover {product.name}, a great addition to your
            everyday shopping collection.
          </p>

          <button
            className="details-add-button"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart size={18} />
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
