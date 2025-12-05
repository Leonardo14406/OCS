import Link from "next/link"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Ombudsman Portal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An independent office dedicated to investigating complaints against public officials and ensuring
              government accountability.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
                  Submit Complaint
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-muted-foreground hover:text-foreground transition-colors">
                  Track Complaint
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>1-800-OMBUD-01</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@ombudsman.gov</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  123 Government Plaza
                  <br />
                  Capital City, 00001
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Office Hours</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday: 9:00 AM - 5:00 PM</li>
              <li>Saturday: 9:00 AM - 1:00 PM</li>
              <li>Sunday: Closed</li>
              <li className="pt-2 text-xs">Emergency hotline available 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-sm text-muted-foreground flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Office of the Ombudsman. All rights reserved.</p>
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <LoginLink postLoginRedirectURL="/api/auth/official-redirect">
              <button className="text-xs underline-offset-2 hover:underline text-muted-foreground">
                Login as an official
              </button>
            </LoginLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
