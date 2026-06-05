import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  ArrowLeft,
  MapPin,
  CalendarDays,
  VenusAndMars,
  Cake,
  ImagePlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../api/auth";
import "./profileSettings.css";

function ProfileSettings() {
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem("user")) || {};

  const getBackRoute = () => {
    const role = String(savedUser.role || "").toLowerCase();

    if (role === "hr_manager" || role === "hr manager" || role === "hr_clerk") {
      return "/dashboard";
    }

    return "/employee-dashboard";
  };

  const [profileImage, setProfileImage] = useState(savedUser.profileImage || "");
  const [firstName, setFirstName] = useState(
    savedUser.firstName || savedUser.first_name || ""
  );
  const [lastName, setLastName] = useState(
    savedUser.lastName || savedUser.last_name || ""
  );
  const [email, setEmail] = useState(savedUser.email || "");
  const [gender, setGender] = useState(savedUser.gender || "");
  const [birthday, setBirthday] = useState(savedUser.birthday || "");
  const [age, setAge] = useState(savedUser.age || "");
  const [address, setAddress] = useState(savedUser.address || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 300;
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setProfileImage(compressedBase64);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const userId = savedUser.id || savedUser._id;

      if (!userId && !email) {
        alert("User account not found. Please login again.");
        return;
      }

      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        alert("First name, last name, and email are required.");
        return;
      }

      if (password && password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      setSaving(true);

      const payload = {
        id: userId,
        _id: userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        gender,
        birthday,
        age,
        address,
        profileImage,
        role: savedUser.role,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const result = await updateProfile(userId, payload);

      if (!result.ok) {
        alert(result.data?.message || "Failed to update profile.");
        return;
      }

      const userFromServer = result.data?.user || {};

      const updatedUser = {
        ...savedUser,
        ...userFromServer,
        id: userFromServer.id || userFromServer._id || userId,
        _id: userFromServer._id || userFromServer.id || userId,
        firstName: userFromServer.firstName || firstName,
        lastName: userFromServer.lastName || lastName,
        first_name: userFromServer.first_name || firstName,
        last_name: userFromServer.last_name || lastName,
        name: userFromServer.name || `${firstName} ${lastName}`.trim(),
        email: userFromServer.email || email,
        gender,
        birthday,
        age,
        address,
        profileImage,
        role: userFromServer.role || savedUser.role,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setPassword("");
      setConfirmPassword("");

      alert("Profile updated successfully!");
      navigate(getBackRoute(), { replace: true });
    } catch (error) {
      console.error("PROFILE SAVE ERROR:", error);
      alert("Profile save crashed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button
          className="profile-back-btn"
          onClick={() => navigate(getBackRoute())}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="profile-header">
          <div className="profile-image-section">
            <div className="profile-avatar">
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                <User size={42} />
              )}
            </div>

            <label className="profile-upload-btn">
              <ImagePlus size={16} />
              Change Picture
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <h1>Profile Settings</h1>
          <p>Manage your account information.</p>
        </div>

        <div className="profile-form">
          <div className="profile-row">
            <div className="profile-input-group">
              <label>
                <User size={16} />
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="profile-input-group">
              <label>
                <User size={16} />
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-input-group">
            <label>
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="profile-row">
            <div className="profile-input-group">
              <label>
                <VenusAndMars size={16} />
                Gender
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="profile-input-group">
              <label>
                <Cake size={16} />
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-input-group">
            <label>
              <CalendarDays size={16} />
              Birthday
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <div className="profile-input-group">
            <label>
              <MapPin size={16} />
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="profile-row">
            <div className="profile-input-group">
              <label>
                <Lock size={16} />
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="profile-input-group">
              <label>
                <Lock size={16} />
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;