// Server base domain url 
// const domainUrl = "http://localhost:3000";  // Use this for local testing

 const domainUrl = "https://giftdeliveryapp-1.onrender.com";  // Use this for render testing


let debug = true;
let authenticated = false;

$(document).ready(function () {

	/** ---------------------- Login Handler ---------------------- **/

	$('#loginButton').click(function () {
		localStorage.removeItem("inputData");
		$("#loginForm").submit();

		if (localStorage.inputData != null) {
			const inputData = JSON.parse(localStorage.getItem("inputData"));

			$.post(domainUrl + "/verifyUserCredential", inputData, function (data, status) {
				if (debug) alert("Data received: " + JSON.stringify(data));
				if (debug) alert("Status: " + status);

				if (Object.keys(data).length > 0) {
					alert("Login success");
					authenticated = true;
					localStorage.setItem("userInfo", JSON.stringify(data));
					localStorage.setItem("loggedInEmail", data.email);
					$("body").pagecontainer("change", "#homePage");
				} else {
					alert("Login failed");
				}

				$("#loginForm").trigger('reset');
			});
		}
	});

	$("#loginForm").validate({
		focusInvalid: false,
		onkeyup: false,
		submitHandler: function (form) {
			const formData = $(form).serializeArray();
			const inputData = {};
			formData.forEach(data => {
				inputData[data.name] = data.value;
			});
			localStorage.setItem("inputData", JSON.stringify(inputData));
		},
		rules: {
			email: {
				required: true,
				email: true
			},
			password: {
				required: true,
				rangelength: [3, 10]
			}
		},
		messages: {
			email: {
				required: "Please enter your email",
				email: "The email format is incorrect"
			},
			password: {
				required: "The password cannot be empty",
				rangelength: $.validator.format("Minimum Password Length: {0}, Maximum Password Length: {1}")
			}
		}
	});

	/** ---------------------- Item Selection Handler ---------------------- **/

	$('#itemList li').click(function () {
		const itemName = $(this).find('#itemName').html();
		const itemPrice = $(this).find('#itemPrice').html();
		const itemImage = $(this).find('#itemImage').attr('src');

		localStorage.setItem("itemName", itemName);
		localStorage.setItem("itemPrice", itemPrice);
		localStorage.setItem("itemImage", itemImage);
	});

	/** ---------------------- Order Submission Handler ---------------------- **/

	$('#confirmOrderButton').click(function () {
		localStorage.removeItem("inputData");
		$("#orderForm").submit();

		if (localStorage.inputData != null) {
			const orderInfo = JSON.parse(localStorage.getItem("inputData"));
			orderInfo.itemName = localStorage.getItem("itemName");
			orderInfo.itemPrice = localStorage.getItem("itemPrice");
			orderInfo.itemImage = localStorage.getItem("itemImage");

			const userInfo = JSON.parse(localStorage.getItem("userInfo"));
			orderInfo.customerEmail = userInfo.email;

			orderInfo.orderNo = Math.trunc(Math.random() * 900000 + 100000);
			orderInfo.date = new Date().toLocaleDateString();  // Add dispatch date

			localStorage.setItem("orderInfo", JSON.stringify(orderInfo));
			if (debug) alert(JSON.stringify(orderInfo));

			$.post(domainUrl + "/insertOrderData", orderInfo, function (data, status) {
				if (debug) alert("Data sent: " + JSON.stringify(data));
				if (debug) alert("Status: " + status);

				$("#orderForm").trigger('reset');
				$("body").pagecontainer("change", "#orderConfirmationPage");
			});
		}
	});

	$("#orderForm").validate({
		focusInvalid: false,
		onkeyup: false,
		submitHandler: function (form) {
			const formData = $(form).serializeArray();
			const inputData = {};
			formData.forEach(data => {
				inputData[data.name] = data.value;
			});
			if (debug) alert(JSON.stringify(inputData));
			localStorage.setItem("inputData", JSON.stringify(inputData));
		},
		rules: {
			firstName: {
				required: true,
				rangelength: [1, 15],
				validateName: true
			},
			lastName: {
				required: true,
				rangelength: [1, 15],
				validateName: true
			},
			phoneNumber: {
				required: true,
				mobiletxt: true
			},
			address: {
				required: true,
				rangelength: [1, 25]
			},
			postcode: {
				required: true,
				posttxt: true
			}
		},
		messages: {
			firstName: {
				required: "Please enter your firstname",
				rangelength: $.validator.format("Contains a maximum of {1} characters")
			},
			lastName: {
				required: "Please enter your lastname",
				rangelength: $.validator.format("Contains a maximum of {1} characters")
			},
			phoneNumber: {
				required: "Phone number required"
			},
			address: {
				required: "Delivery address required",
				rangelength: $.validator.format("Contains a maximum of {1} characters")
			},
			postcode: {
				required: "Postcode required"
			}
		}
	});

	async function fetchAndDisplayOrders() {
    const email = localStorage.getItem("loggedInEmail");
    if (!email) {
        alert("You must be logged in to view past orders.");
        return;
    }

    try {
        const response = await fetch(`${domainUrl}/api/orders/${email}`);
        const orders = await response.json();

        const orderListContainer = document.getElementById("orderList"); 
        orderListContainer.innerHTML = "";

        if (orders.length === 0) {
            orderListContainer.innerHTML = "<li>No past orders found.</li>";
            return;
        }

        orders.forEach(order => {
            const li = document.createElement("li");
            li.innerHTML = `
                <h3>Order #${order.orderNo}</h3>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Item:</strong> ${order.itemName}</p>
                <p><strong>Price:</strong> ${order.itemPrice}</p>
                <p><strong>Distributor:</strong> ${order.distributor}</p>
                <p><strong>Shipping Address:</strong> ${order.address}, ${order.state}, ${order.postcode}</p>
            `;
            orderListContainer.appendChild(li);
        });

        // Refresh the list view if using jQuery Mobile
        if ($(orderListContainer).hasClass("ui-listview")) {
            $(orderListContainer).listview("refresh");
        }

    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        alert("Failed to load past orders.");
    }
}



async function deleteOrders() {
  const email = localStorage.getItem("loggedInEmail");
  if (!email) {
    alert("User not logged in");
    return;
  }
  try {
    const response = await fetch(`${domainUrl}/api/orders/${email}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("Delete failed");
    const data = await response.json();

    // sessionStorage.setItem("deletedCount", data.deletedCount);
	sessionStorage.setItem("deletedOrdersCount", data.deletedCount);

    $.mobile.changePage("#deleteConfirmPage");

  } catch (err) {
    alert("Failed to delete orders");
    console.error(err);
  }
}



	/** ---------------------- Page Events ---------------------- **/

	$(document).on("pageshow", "#orderListPage", function () {
    	fetchAndDisplayOrders();
	});

	$(document).on("pagebeforeshow", "#loginPage", function () {
		localStorage.removeItem("userInfo");
		authenticated = false;
	});

	$(document).on("pagecreate", "#fillOrderPage", function () {
		$("#itemSelected").html(localStorage.getItem("itemName"));
		$("#priceSelected").html(localStorage.getItem("itemPrice"));
		$("#imageSelected").attr('src', localStorage.getItem("itemImage"));
	});

	$(document).on("pagebeforeshow", "#orderConfirmationPage", function () {
		$('#orderInfo').html("");

		if (localStorage.orderInfo != null) {
			const orderInfo = JSON.parse(localStorage.getItem("orderInfo"));

			$('#orderInfo').append(`<br><table><tbody>`);
			$('#orderInfo').append(`<tr><td>Order no: </td><td><span class="fcolor">${orderInfo.orderNo}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Customer: </td><td><span class="fcolor">${orderInfo.customerEmail}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Item: </td><td><span class="fcolor">${orderInfo.itemName}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Price: </td><td><span class="fcolor">${orderInfo.itemPrice}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Recipient: </td><td><span class="fcolor">${orderInfo.firstName} ${orderInfo.lastName}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Phone number: </td><td><span class="fcolor">${orderInfo.phoneNumber}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Address: </td><td><span class="fcolor">${orderInfo.address} ${orderInfo.postcode}</span></td></tr>`);
			$('#orderInfo').append(`<tr><td>Dispatch date: </td><td><span class="fcolor">${orderInfo.date}</span></td></tr>`);
			$('#orderInfo').append(`</tbody></table><br>`);
		} else {
			$('#orderInfo').append('<h3>There is no order to display</h3>');
		}
	});

	/** ---------------------- Add User (Signup) Handler ---------------------- **/

	$(document).on("pagecreate", "#signupPage", function () {
		$("#signupForm").on("submit", function (e) {
			e.preventDefault();

			const formData = {
				email: $("#email").val(),
				password: $("#password").val(),
				firstName: $("#firstName").val(),
				lastName: $("#lastName").val(),
				state: $("#state").val(),
				phone: $("#phone").val(),
				address: $("#address").val(),
				postcode: $("#postcode").val()
			};

			$.ajax({
				url: domainUrl + "/addUser",
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify(formData),
				success: function (response) {
					alert("User registered successfully.");
					$.mobile.changePage("#loginPage");
				},
				error: function (xhr, status, error) {
					console.error("Signup failed:", error);
					alert("Signup failed. Please try again.");
				}
			});
		});
	});

	document.getElementById('doneButton').addEventListener('click', function() {
    // Navigate to Home Page
    $.mobile.changePage('#homePage', {
        transition: 'slide',
        reverse: false
    });
});

$(document).on("pagecreate", "#homePage", function() {
  $("#deleteOrdersLink").on("click", function(e) {
    e.preventDefault();
    deleteOrders();
	
  });
});

$(document).on("pageshow", "#deleteConfirmPage", function () {
  const count = sessionStorage.getItem("deletedOrdersCount") || 0;
  $("#deleteMessage").text(`${count} order(s) deleted`);
});

});
