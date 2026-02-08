import { CheckCircle2, AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";

export function StatusPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const getContent = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />,
          title: "Successfully Marked as Read",
          description: "This issue has been updated in your digest. You can now close this tab or return to your dashboard.",
          buttonText: "Go to Dashboard",
          buttonLink: "/"
        };
      case 'forbidden':
        return {
          icon: <ShieldAlert className="w-16 h-16 text-yellow-500 mb-4" />,
          title: "Access Denied",
          description: "The link you followed is invalid or has expired. Please make sure you are using the original link from your email.",
          buttonText: "Back to Home",
          buttonLink: "/"
        };
      case 'error':
      default:
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500 mb-4" />,
          title: "Something Went Wrong",
          description: "We encountered an unexpected error while processing your request. Please try again later.",
          buttonText: "Back to Home",
          buttonLink: "/"
        };
    }
  };

  const { icon, title, description, buttonText, buttonLink } = getContent();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card p-8 rounded-xl border shadow-lg max-w-md w-full">
        <div className="flex justify-center">{icon}</div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">
          {description}
        </p>
        <Button 
          onClick={() => navigate(buttonLink)}
          className="w-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
