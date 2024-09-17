import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
        apiKey: "AIzaSyCw_iQWTsNtl0a3CxCckkpTIylvLYJm1a4",
        authDomain: "im2-project-dairo.firebaseapp.com",
        projectId: "im2-project-dairo",
        storageBucket: "im2-project-dairo.appspot.com",
        messagingSenderId: "802944102999",
        appId: "1:802944102999:web:40a00359432414e596e912"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

const logoutButton = document.getElementById('logout-button');
const userEmailSpan = document.getElementById('user-email');
const imageUploadForm = document.getElementById('image-upload-form');
const imageFileInput = document.getElementById('imageFile');
const gallery = document.getElementById('gallery');

        auth.onAuthStateChanged(user => {
            if (user) {
                userEmailSpan.textContent = user.email;
            } else {
                userEmailSpan.textContent = 'Not logged in';
                window.location.href = 'index.html';
            }
        });

        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                alert('You have been logged out.');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error logging out:', error);
            });
        });

function displayImage(url) {
    const imgElement = document.createElement('img');
    imgElement.src = url;
    imgElement.alt = 'Uploaded Image'; // Adding alt text for accessibility
    gallery.appendChild(imgElement);
}

imageUploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();  // Prevent page reload
    const file = imageFileInput.files[0];
    const user = auth.currentUser; // Get current user
    if (!file || !user) {
        alert('Please select a file and ensure you are logged in.');
        return;
    }

    const userFolder = `images/${user.uid}/`;  // Create a folder for the user based on their UID
    const storageRef = ref(storage, `${userFolder}${new Date().getTime()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            console.log('Upload in progress...');
        }, 
        (error) => {
            console.error('Upload failed:', error);
            alert('Upload failed! Please try again.');
        }, 
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Upload successful. File available at:', downloadURL);
            await addDoc(collection(db, "images"), {
                url: downloadURL,
                uid: user.uid  // Store the UID of the user who uploaded the image
            });
            displayImage(downloadURL); // Display the uploaded image on the page
        }
    );
});

// Display images for the logged-in user
async function loadImages() {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return;
    }

    gallery.innerHTML = ''; // Clear the gallery before loading new images

    const querySnapshot = await getDocs(collection(db, "images"));
    querySnapshot.forEach((doc) => {
        const imageData = doc.data();
        // Only display images uploaded by the current user
        if (imageData.uid === user.uid) {
            displayImage(imageData.url);
        }
    });
}

// Load images on page load
window.addEventListener('load', loadImages);