function fetchAndDisplayProfilePicture(elementId) {
    fetch("https://shark-cms.gloor.dev/wp-json/wp/v2/get-profile-picture/", {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("userToken")
      }
    })
    .then(response => response.json()) 
    .then(data => {
      const imgElement = document.getElementById(elementId);
      if (data.profilePictureUrl && imgElement) {
        imgElement.src = data.profilePictureUrl;
        imgElement.style.display = 'inline'; // Show the image
      } else if (imgElement) {
        imgElement.style.display = 'none'; // Hide the image
      }
    })
    .catch(error => console.error("Error:", error));
}
