const folderButtons = document.querySelectorAll(".folderButton");

for (const button of folderButtons) {
    const children = button.parentElement.querySelector("ul");

    button.addEventListener("click", (ev) => {
        let icon, display;
        if (children.style.display !== "none") {
            icon = "📁 "
            display = "none";
        } else {
            icon = "📂 ";
            display = "block";
        }
        button.textContent = icon;
        children.style.display = display;
    })
}
