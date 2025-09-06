import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPortalUploads, deletePortalUpload } from "@/utils/api";
import apiClient from "@utils/apiclient";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { get_current_user_token } from "@/utils/auth"; // ✅ import your token helper

export default function RoleImageDashboardCard({ role }) {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ get current user info from token
  const currentUser = get_current_user_token();
  const userRole = currentUser?.role?.toUpperCase?.(); // normalize role (ADMIN/MEMBER/etc.)

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      try {
        if (role) {
          const data = await fetchPortalUploads({ departmentName: role });

          const backendBaseUrl = apiClient.defaults.baseURL.replace(/\/api$/, "");

          const formattedData = (data || []).map((item) => ({
            ...item,
            file_url: item.file_url.startsWith("http")
              ? item.file_url
              : `${backendBaseUrl}${item.file_url}`,
          }));

          setImages(formattedData);
        }
      } catch (error) {
        console.error("Failed to load portal uploads:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadImages();
  }, [role]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this upload?")) return;
    try {
      await deletePortalUpload(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete upload");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center text-gray-500">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (!images.length) return null;

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-0">
        <div className="p-6 pb-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground capitalize">
            {role} Noticeboard
          </h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className="group relative aspect-square overflow-hidden bg-muted rounded-lg border border-border"
              >
                <img
                  src={img.file_url}
                  alt={`${role} upload ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-foreground font-semibold text-sm bg-background/90 px-3 py-1 rounded-full border border-border shadow-sm">
                      View Image
                    </div>
                    {/* ✅ Only show delete button if user is ADMIN */}
                    {userRole === "ADMIN" && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(img.id)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
