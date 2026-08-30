import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Patient Profile</h2>
      <p>Manage your MediVault patient account.</p>
      {user && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>
        </div>
      )}
    </div>
  );
}

export default Profile;