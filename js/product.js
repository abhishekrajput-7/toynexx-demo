// ======================================================
// TOYNEXX - PRODUCT PAGE
// ======================================================


// ======================================================
// GET PRODUCT
// ======================================================

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const product = PRODUCTS.find(p => p.id === productId);


// ======================================================
// PRODUCT NOT FOUND
// ======================================================

if (!product) {

    const productName = document.getElementById("productName");

    if (productName) {
        productName.textContent = "Product Not Found";
    }

    throw new Error("Product not found");
}


// ======================================================
// BASIC PRODUCT INFORMATION
// ======================================================

const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");
const longDescription = document.getElementById("longDescription");
const mainProductImage = document.getElementById("mainProductImage");

if (productName) {
    productName.textContent = product.name;
}

if (productPrice) {
    productPrice.textContent = `₹${product.price}`;
}

if (productDescription) {
    productDescription.textContent = product.desc;
}

if (longDescription) {
    longDescription.textContent =
        product.longDesc || product.desc;
}

if (mainProductImage) {
    mainProductImage.src = product.image;
}


// ======================================================
// BADGE
// ======================================================

const badge = document.getElementById("productBadge");

if (badge) {

    badge.textContent = product.badge || "Premium";

}


// ======================================================
// OLD PRICE
// ======================================================

const oldPrice = document.getElementById("oldPrice");

if (oldPrice) {

    if (product.oldPrice) {

        oldPrice.textContent = `₹${product.oldPrice}`;
        oldPrice.style.display = "";

    } else {

        oldPrice.style.display = "none";

    }

}


// ======================================================
// DISCOUNT
// ======================================================

const discount = document.getElementById("discount");

if (discount) {

    if (product.oldPrice && product.oldPrice > product.price) {

        const off = Math.round(
            ((product.oldPrice - product.price) /
                product.oldPrice) * 100
        );

        discount.textContent = `${off}% OFF`;
        discount.style.display = "";

    } else {

        discount.style.display = "none";

    }

}


// ======================================================
// STOCK
// ======================================================

const stockText = document.getElementById("stockText");

const stock = Number(product.stock) || 0;

if (stockText) {

    stockText.textContent = `In Stock (${stock} left)`;

}


// ======================================================
// IMAGE GALLERY
// ======================================================

const thumbs = document.querySelector(".thumbnail-gallery");

if (thumbs) {

    thumbs.innerHTML = "";

    const galleryImages =
        product.gallery &&
        Array.isArray(product.gallery) &&
        product.gallery.length
            ? product.gallery
            : [product.image];


    galleryImages.forEach((img, index) => {

        const image = document.createElement("img");

        image.src = img;
        image.alt = product.name;

        image.style.border =
            index === 0
                ? "2px solid #ffb703"
                : "2px solid transparent";


        image.onclick = () => {

            if (mainProductImage) {
                mainProductImage.src = img;
            }

            document
                .querySelectorAll(".thumbnail-gallery img")
                .forEach(i => {
                    i.style.border =
                        "2px solid transparent";
                });

            image.style.border =
                "2px solid #ffb703";

        };


        thumbs.appendChild(image);

    });

}


// ======================================================
// RATING
// ======================================================

const ratingText = document.getElementById("ratingText");

if (ratingText) {

    ratingText.textContent =
        `${product.rating || 0} • ${product.reviews || 0} Reviews`;

}


// ======================================================
// QUANTITY SYSTEM
// ======================================================

let qty = 1;

const qtyInput = document.getElementById("qtyInput");
const plusQty = document.getElementById("plusQty");
const minusQty = document.getElementById("minusQty");


// Set initial quantity

if (qtyInput) {

    qtyInput.value = qty;

    qtyInput.min = "1";

    if (stock > 0) {
        qtyInput.max = String(stock);
    }

}


// ======================================================
// PLUS BUTTON
// ======================================================

if (plusQty) {

    plusQty.onclick = () => {

        if (stock > 0 && qty >= stock) {
            qty = stock;
        } else {
            qty++;
        }

        if (qtyInput) {
            qtyInput.value = qty;
        }

    };

}


// ======================================================
// MINUS BUTTON
// ======================================================

if (minusQty) {

    minusQty.onclick = () => {

        if (qty > 1) {
            qty--;
        }

        if (qtyInput) {
            qtyInput.value = qty;
        }

    };

}


// ======================================================
// MANUAL QUANTITY INPUT
// ======================================================

if (qtyInput) {

    qtyInput.addEventListener("input", () => {

        let value = parseInt(qtyInput.value, 10);

        if (isNaN(value) || value < 1) {
            value = 1;
        }

        if (stock > 0 && value > stock) {
            value = stock;
        }

        qty = value;

        qtyInput.value = qty;

    });

}


// ======================================================
// GET CURRENT QUANTITY
// ======================================================

function getSelectedQuantity() {

    let selectedQty = parseInt(
        qtyInput ? qtyInput.value : qty,
        10
    );

    if (isNaN(selectedQty) || selectedQty < 1) {
        selectedQty = 1;
    }

    if (stock > 0 && selectedQty > stock) {
        selectedQty = stock;
    }

    qty = selectedQty;

    if (qtyInput) {
        qtyInput.value = qty;
    }

    return selectedQty;

}


// ======================================================
// ADD TO CART
// ======================================================

const addCartBtn = document.getElementById("addCartBtn");

if (addCartBtn) {

    addCartBtn.addEventListener("click", () => {

        // Get selected quantity
        const selectedQty = getSelectedQuantity();


        // Get existing cart
        let cart = [];

        try {

            const savedCart =
                localStorage.getItem("cart");

            cart = savedCart
                ? JSON.parse(savedCart)
                : [];

            if (!Array.isArray(cart)) {
                cart = [];
            }

        } catch (error) {

            console.error(
                "Cart data corrupted. Resetting cart."
            );

            cart = [];

        }


        // Find existing product
        const existingIndex = cart.findIndex(
            item => item.id === product.id
        );


        // ==================================================
        // IMPORTANT:
        // EXISTING PRODUCT = REPLACE QUANTITY
        //
        // Example:
        // Cart has 5
        // User selects 4
        // Add To Cart
        // Result = 4
        //
        // NOT 5 + 4 = 9
        // ==================================================

        if (existingIndex !== -1) {

            cart[existingIndex].qty = selectedQty;

        } else {

            cart.push({
                id: product.id,
                qty: selectedQty
            });

        }


        // Save cart
        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );


        // Go to cart
        window.location.href = "cart.html";

    });

}


// ======================================================
// BUY NOW
// ======================================================

const buyNowBtn = document.getElementById("buyNowBtn");

if (buyNowBtn) {

    buyNowBtn.addEventListener("click", () => {

        const selectedQty = getSelectedQuantity();


        localStorage.setItem(
            "buyNowProduct",
            JSON.stringify({
                id: product.id,
                qty: selectedQty
            })
        );


        localStorage.setItem(
            "checkoutType",
            "buyNow"
        );


        window.location.href = "checkout.html";

    });

}


// ======================================================
// SHARE BUTTON
// ======================================================

const shareBtn =
    document.querySelector(".share-btn");

if (shareBtn) {

    shareBtn.onclick = async () => {

        if (navigator.share) {

            try {

                await navigator.share({
                    title: product.name,
                    text: product.desc,
                    url: window.location.href
                });

            } catch (error) {

                console.log(
                    "Share cancelled."
                );

            }

        } else {

            try {

                await navigator.clipboard.writeText(
                    window.location.href
                );

                alert("Product link copied!");

            } catch (error) {

                alert(
                    "Unable to copy product link."
                );

            }

        }

    };

}


// ======================================================
// WISHLIST
// ======================================================

const wishBtn =
    document.querySelector(".wishlist-btn");

if (wishBtn) {

    wishBtn.onclick = () => {

        let wishlist = [];

        try {

            wishlist =
                JSON.parse(
                    localStorage.getItem("wishlist")
                ) || [];

            if (!Array.isArray(wishlist)) {
                wishlist = [];
            }

        } catch (error) {

            wishlist = [];

        }


        const index =
            wishlist.indexOf(product.id);


        if (index === -1) {

            wishlist.push(product.id);

            wishBtn.classList.add("active");

        } else {

            wishlist.splice(index, 1);

            wishBtn.classList.remove("active");

        }


        localStorage.setItem(
            "wishlist",
            JSON.stringify(wishlist)
        );

    };

}


// ======================================================
// RELATED PRODUCTS
// ======================================================

const relatedContainer =
    document.getElementById("relatedProducts");

if (relatedContainer) {

    const relatedProducts =
        PRODUCTS
            .filter(p =>
                p.category === product.category &&
                p.id !== product.id
            )
            .slice(0, 4);


    relatedContainer.innerHTML = "";


    relatedProducts.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "product-card";

        card.style.cursor = "pointer";


        card.onclick = () => {

            window.location.href =
                `product.html?id=${item.id}`;

        };


        const image =
            document.createElement("img");

        image.src = item.image;
        image.alt = item.name;


        const title =
            document.createElement("h3");

        title.textContent = item.name;


        const price =
            document.createElement("p");

        price.textContent = `₹${item.price}`;


        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(price);


        relatedContainer.appendChild(card);

    });

}