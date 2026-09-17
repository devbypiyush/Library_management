document.addEventListener("DOMContentLoaded", function () {

    /* ================================
       MOBILE LANDING MENU
    ================================= */

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", function () {

            navLinks.classList.toggle("mobile-open");

            if (navLinks.classList.contains("mobile-open")) {

                navLinks.style.display = "flex";
                navLinks.style.position = "absolute";
                navLinks.style.top = "78px";
                navLinks.style.left = "0";
                navLinks.style.right = "0";
                navLinks.style.padding = "20px";
                navLinks.style.background = "#ffffff";
                navLinks.style.flexDirection = "column";
                navLinks.style.gap = "18px";

            } else {

                navLinks.style.display = "";

            }

        });

    }


    /* ================================
       DASHBOARD SIDEBAR
    ================================= */

    const dashMenu = document.getElementById("dashMenu");
    const sidebar = document.getElementById("sidebar");

    if (dashMenu && sidebar) {

        dashMenu.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }


    /* ================================
       PASSWORD SHOW / HIDE
    ================================= */

    const passwordButtons =
        document.querySelectorAll(".password-toggle");

    passwordButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const input =
                button.parentElement.querySelector("input");

            if (input.type === "password") {

                input.type = "text";

                button.innerHTML =
                    '<i class="fa-regular fa-eye-slash"></i>';

            } else {

                input.type = "password";

                button.innerHTML =
                    '<i class="fa-regular fa-eye"></i>';

            }

        });

    });


    /* ================================
       LOGIN
    ================================= */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const email =
                document.getElementById("email").value;

            const password =
                document.getElementById("password").value;


            if (email.trim() === "" ||
                password.trim() === "") {

                alert("Please enter email and password.");

                return;

            }


            /*
             * TEMPORARY FRONTEND LOGIN
             *
             * Later this will call:
             *
             * POST /api/auth/login
             *
             * Spring Boot backend.
             */

            window.location.href =
                "admin/dashboard.html";

        });

    }


    /* ================================
       REGISTRATION
    ================================= */

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value;

            const email =
                document.getElementById("email").value;

            const password =
                document.getElementById("password").value;


            if (
                name.trim() === "" ||
                email.trim() === "" ||
                password.trim() === ""
            ) {

                alert("Please complete all fields.");

                return;

            }


            /*
             * TEMPORARY FRONTEND REGISTRATION
             *
             * Later:
             *
             * POST /api/auth/register
             */

            alert(
                "Account created successfully!"
            );

            window.location.href =
                "admin/dashboard.html";

        });

    }

});