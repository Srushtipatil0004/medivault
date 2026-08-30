import { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneCredential, setPhoneCredential] = useState(null);
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const navigate = useNavigate();

  // Initialize reCAPTCHA verifier once
  useEffect(() => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {},
        }
      );
    }
  }, []);

  // Countdown for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const id = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [resendTimer]);

  const validateMobile = (num) => /^\d{10}$/.test(num);

  const sendOTP = async () => {
    setError("");
    setSuccess("");
    if (!validateMobile(mobile)) {
      setError("Enter a valid 10‑digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      const phoneNumber = "+91" + mobile;
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) throw new Error("reCAPTCHA not ready");
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setResendTimer(60);
      setSuccess("OTP sent to " + phoneNumber);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    setSuccess("");
    if (!otp || otp.length !== 6) {
      setError("Enter the 6‑digit OTP.");
      return;
    }
    setLoading(true);
    try {
      // Create a phone credential from the verification ID and OTP without signing in
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otp
      );
      setPhoneCredential(credential);
      setOtpVerified(true);
      setSuccess("Mobile number verified.");
    } catch (err) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!otpVerified || !phoneCredential) {
      setError("Please verify your mobile number first.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Link phone credential to the email/password user
      await linkWithCredential(user, phoneCredential);
      // Update profile with full name
      await updateProfile(user, { displayName: fullName });
      navigate("/");
    } catch (err) {
      const msg = err.message;
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (msg.includes("credential-already-in-use")) {
        setError("This phone number is already linked to another account.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-page">
      <header className="page-header">
        <div className="header-text">
          <h1>Create account</h1>
          <p className="subtitle">Join MediVault and manage your health securely</p>
        </div>
      </header>

      <main className="auth-main">
        <article className="glass-card auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mobile">Mobile Number (+91)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="10‑digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  maxLength={10}
                  autoComplete="tel"
                  disabled={loading || otpSent}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={sendOTP}
                  disabled={loading || otpSent || resendTimer > 0 || !validateMobile(mobile)}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="form-field">
                <label htmlFor="otp">Enter OTP</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    id="otp"
                    type="text"
                    placeholder="6‑digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={loading}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={verifyOTP}
                    disabled={loading || otpVerified || otp.length !== 6}
                  >
                    {otpVerified ? "Verified" : "Verify OTP"}
                  </button>
                </div>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !otpVerified}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* invisible reCAPTCHA container */}
          <div ref={recaptchaContainerRef} style={{ display: "none" }} />

          <p className="auth-footer">
            Already have an account? <NavLink to="/login">Sign in</NavLink>
          </p>
        </article>
      </main>
    </div>
  );
}

export default Register;