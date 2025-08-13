const imageInput = document.getElementById("image");
const preview = document.getElementById("preview");
const submitBtn = document.getElementById("submitBtn");

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    // Preview set karna
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    // Button enable
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    preview.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
});
