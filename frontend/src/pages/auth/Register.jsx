import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { 
  fetchChurchesForRegistration, 
  fetchDepartmentsForChurch,
  registerUser,
  uploadUserPhoto
} from "@/utils/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState(""); // YYYY-MM-DD
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [photo, setPhoto] = useState(null);

  const [churchId, setChurchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load churches
  useEffect(() => {
    const loadChurches = async () => {
      setIsLoadingChurches(true);
      try {
        const data = await fetchChurchesForRegistration();
        setChurches(data);
      } catch (err) {
        console.error("Error fetching churches:", err);
        setError("Could not load churches. Please refresh the page.");
      } finally {
        setIsLoadingChurches(false);
      }
    };
    loadChurches();
  }, []);

  // Load departments when church changes
  useEffect(() => {
    const loadDepartments = async () => {
      if (churchId) {
        setIsLoadingDepartments(true);
        try {
          const data = await fetchDepartmentsForChurch(churchId);
          setDepartments(data);
          setDepartmentId("");
        } catch (err) {
          console.error("Error fetching departments:", err);
          setError("Could not load departments for the selected church.");
          setDepartments([]);
        } finally {
          setIsLoadingDepartments(false);
        }
      } else {
        setDepartments([]);
        setDepartmentId("");
      }
    };
    loadDepartments();
  }, [churchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      // Prepare user data
      const userData = {
        name,
        email,
        password,
        address: address || null,
        birthday: birthday || null, // YYYY-MM-DD
        phone: phone || null,
        sex: sex || null,
        church_id: churchId ? parseInt(churchId) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
      };

      // Register user
      const registrationResult = await registerUser(userData);

      // If photo is provided, upload it
      if (photo && registrationResult.user_id) {
        try {
          await uploadUserPhoto(registrationResult.user_id, photo);
        } catch (photoError) {
          console.error("Photo upload failed:", photoError);
          // Don't block registration on photo upload failure
        }
      }

      setSuccess(
        "🎉 Registration successful! Please check your email to verify your account before logging in."
      );
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:scale-[1.01] duration-300"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Create an Account
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-center animate-pulse">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="mt-4 space-y-4">
          <select
            value={churchId}
            onChange={(e) => setChurchId(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoadingChurches || isSubmitting}
            required
          >
            <option value="">
              {isLoadingChurches ? "Loading Churches..." : "Select Church"}
            </option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.location})
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            disabled={!churchId || isLoadingDepartments || isSubmitting}
            required
          >
            <option value="">
              {isLoadingDepartments ? "Loading Departments..." : "Select Department"}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-orange-700 transition-colors duration-300 disabled:bg-orange-400 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}
