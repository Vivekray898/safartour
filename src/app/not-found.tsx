import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 pt-32 text-center">
      <p className="font-display text-7xl font-extrabold text-primary/15">
        404
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-base text-muted">
        The page you&apos;re looking for may have been moved or is currently
        unavailable. The mountains are still where we left them.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary" size="lg">
          Back to Home
        </Button>
        <Button href="/packages" variant="outline" size="lg">
          View All Packages
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Looking for something specific?{" "}
        <Link
          href="/contact"
          className="font-medium text-primary hover:underline"
        >
          Contact us
        </Link>{" "}
        and we&apos;ll point you the right way.
      </p>
    </Container>
  );
}
