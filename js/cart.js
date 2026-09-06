// ==========================
// TOYNEXX CART
// ==========================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];

const cartItems =
    document.getElementById("cartItems");

const emptyCart =
    document.getElementById("emptyCart");

const subtotal =
    document.getElementById("subtotal");

const delivery =
    document.getElementById("delivery");

const discountAmount =
    document.getElementById("discountAmount");

const grandTotal =
    document.getElementById("grandTotal");

function renderCart() {

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        document.querySelector(".cart-layout").style.display = "none";

        emptyCart.style.display = "block";

        return;

    }

    document.querySelector(".cart-layout").style.display = "grid";

    emptyCart.style.display = "none";

    let sub = 0;

    cart.forEach(item => {

        const product =
            PRODUCTS.find(p => p.id === item.id);

        if (!product) return;

        sub += product.price * item.qty;

        cartItems.innerHTML += `

<div class="cart-item">

    <img src="${product.image}" alt="${product.name}">

    <div class="item-details">

        <h3>${product.name}</h3>

        <div class="item-price">
            ₹${product.price}
        </div>

        <div class="qty-box">

            <button
                onclick="decreaseQty('${product.id}')">
                −
            </button>

            <span>${item.qty}</span>

            <button
                onclick="increaseQty('${product.id}')">
                +
            </button>

        </div>

        <button
            class="remove-btn"
            onclick="removeItem('${product.id}')">

            Remove

        </button>

    </div>

</div>

`;

    });


    const deliveryCharge = sub > 0 ? 50 : 0;

const discount = 0;

subtotal.textContent = `₹${sub}`;

delivery.textContent = `₹${deliveryCharge}`;

discountAmount.textContent = `₹${discount}`;

grandTotal.textContent = `₹${sub + deliveryCharge - discount}`;

}

// ==========================
// Quantity +
// ==========================

function increaseQty(id){

    const item =
        cart.find(p => p.id === id);

    if(item){

        item.qty++;

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCart();

}

// ==========================
// Quantity -
// ==========================

function decreaseQty(id){

    const item =
        cart.find(p => p.id === id);

    if(item){

        item.qty--;

        if(item.qty <= 0){

            cart =
                cart.filter(p => p.id !== id);

        }

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCart();

}

// ==========================
// Remove Item
// ==========================

function removeItem(id){

    cart =
        cart.filter(p => p.id !== id);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCart();

}

// ==========================
// Buttons
// ==========================

document
.getElementById("continueBtn")
.onclick = () => {

    window.location.href = "index.html";

};

document
.getElementById("checkoutBtn")
.onclick = () => {

    localStorage.setItem("checkoutType", "cart");

    window.location.href = "checkout.html";

};

// ==========================
// Start
// ==========================

renderCart(); 
