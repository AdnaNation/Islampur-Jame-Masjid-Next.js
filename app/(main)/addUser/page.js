import AdminRoute from "@/components/AdminRoute";
import AddUserForm from "@/components/forms/AddUserForm";

export default function AddUserPage() {
  return (
    <AdminRoute>
      <AddUserForm />
    </AdminRoute>
  );
}
