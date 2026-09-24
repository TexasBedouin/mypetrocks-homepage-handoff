 import { Header } from "@/components/landing/Header";
 import { Footer } from "@/components/landing/Footer";
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from "@/components/ui/accordion";
import { Seo } from "@/components/seo/Seo";
import { faqPageSchema } from "@/lib/seo/schema";
 
 export const faqData = [
   {
     category: "About the Portraits",
     items: [
       {
         question: "How does it work?",
         answer: "Upload a clear photo of your pet, pick your favorite artistic styles, and we'll create stunning portraits. Each style is crafted with creative direction and quality review to make sure your pet looks amazing. Most portraits are ready within minutes through the app."
       },
       {
         question: "What styles are available?",
         answer: "We are starting with 16+ artistic styles ranging from Japanese ukiyo-e and Victorian engravings to contemporary manga, cyberpunk aesthetics, and more. Each style is inspired by classical and contemporary art traditions — think museum-quality art starring your pet."
       },
       {
         question: "Is this AI-generated art?",
         answer: "Yes. We use AI image generation tools combined with creative direction, careful prompt engineering, and quality review. Each style has been developed through 30–50+ design iterations to achieve the look we want. We believe in full transparency — and we think the results speak for themselves."
       },
       {
         question: "Will my portrait look exactly like my pet?",
         answer: "Our portraits capture your pet's likeness, coloring, breed characteristics, and personality within the chosen artistic style. Since each style has its own aesthetic (watercolor, woodblock print, manga, etc.), the result is an artistic interpretation — not a photocopy. That's what makes it art."
       }
     ]
   },
   {
     category: "Photos & Privacy",
     items: [
       {
         question: "What kind of photo should I upload?",
         answer: "For best results: A clear, close-up photo of your pet's face — the closer and sharper, the better. Good lighting (natural light works great). Just your pet — crop out humans, other animals, and busy backgrounds. Front-facing or slight angle — we need to see their features clearly. Avoid: blurry photos, photos where your pet is far away, group shots, or photos of you holding your pet."
       },
       {
         question: "What happens to my photo after I upload it?",
         answer: "Your photo is sent to our AI generation service to create your portrait, then automatically deleted within 24 hours. We don't keep your original photos. Your generated portraits are stored in your account so you can download them anytime."
       },
       {
         question: "Are my photos used to train AI?",
         answer: "No, never. Your photos are used solely to create your specific portraits and are then deleted. They are never used to train, fine-tune, or improve any AI models."
       },
       {
         question: "Is my data safe?",
         answer: "Yes. We use encrypted connections (HTTPS), secure phone authentication, and PCI-compliant payment processing through Stripe. Read our full Privacy Policy for details."
       }
     ]
   },
   {
     category: "Ordering & Payment",
     items: [
       {
         question: "How much does it cost?",
         answer: "We offer flexible pricing tiers so you can get exactly what you want. Check our current pricing on the app or our Etsy shop. We also occasionally run promotions and bundle deals."
       },
       {
         question: "What payment methods do you accept?",
         answer: "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover. Apple Pay and Google Pay are also supported. For Etsy orders, all standard Etsy payment methods apply."
       },
       {
         question: "How do I receive my portraits?",
         answer: "Digital portraits are delivered via email and are available for download in your account on mypet.rocks. You'll receive a notification as soon as they're ready."
       },
       {
         question: "Can I order physical prints?",
         answer: "Yes — gallery-quality canvas and poster prints, shipped right to your door (US, typically 5–10 business days) and fulfilled by our print partner. You see and approve your portrait before we print it, and every order is backed by our guarantee: love it, or we'll make it right."
       }
     ]
   },
   {
     category: "Refunds & Issues",
     items: [
       {
         question: "What if I don't like my portrait?",
         answer: "Then you don't pay for it. You see a free preview before checkout, so you know what you're getting before you spend a cent. Already ordered a print and changed your mind? Just ask… we'll refund you any time before it goes to the printer. Email woof@mypet.rocks with your order number and we'll sort it out."
       },
       {
         question: "Can I get a refund?",
         answer: "For prints, yes. Any time before we send your order to the printer, a refund is yours, no fuss. Once it's gone to print we can't pull it back, so that's the only catch. Digital downloads are a little different since they're yours the moment they land, but if something's genuinely wrong, email woof@mypet.rocks within 7 days and we'll make it right."
       },
       {
         question: "My portrait doesn't look like my pet. What happened?",
         answer: "This usually comes down to the upload photo. If the original photo was blurry, far away, or had a busy background, the AI may not capture your pet's features well. Send us a clearer photo and we'll happily regenerate it."
       }
     ]
   },
   {
     category: "Technical Questions",
     items: [
       {
         question: "What devices does it work on?",
         answer: "MyPet.rocks works on any modern smartphone, tablet, or computer with a web browser. No app download required — it's all web-based."
       },
       {
         question: "What file format are the portraits?",
         answer: "High-resolution PNG files at 4K resolution (300 DPI), suitable for printing up to 20×20 inches at full quality. They also work perfectly as phone wallpapers, desktop backgrounds, and social media posts."
       },
       {
         question: "How long does generation take?",
         answer: "Typically a few minutes through the app."
       },
       {
         question: "I'm having trouble uploading my photo. What should I do?",
         answer: "Make sure your photo is in JPEG or PNG format and under 10MB. If you're still having trouble, try a different browser or device. If the issue persists, email us at woof@mypet.rocks with a description of the problem and we'll help you out."
       }
     ]
   },
   {
     category: "About MyPet.rocks",
     items: [
       {
         question: "Who makes this?",
         answer: "MyPet.rocks is a small studio based in Austin, Texas. We started because we believe that seeing your pet brings you a jolt of happiness — and we wanted to extend that feeling beyond your phone's camera roll and into your living space. Every style is designed to be genuine art you'd be proud to hang on your wall."
       },
       {
         question: "Why classical art styles?",
         answer: "We deliberately chose styles inspired by classical art traditions — Japanese ukiyo-e, Victorian engravings, Art Nouveau, and more — because they're beautiful, timeless, and don't copy the work of living artists. We care deeply about the creative community and made this choice intentionally."
       },
       {
         question: "Do you support any causes?",
         answer: "Yes! Our \"Art That Saves\" endangered species collection donates 10% of revenue to wildlife conservation. We also support initiatives for artists impacted by AI through transparent giving-back programs."
       },
       {
         question: "How can I contact you?",
         answer: "Email: woof@mypet.rocks. You can also find us on Instagram, Facebook and TikTok. We typically respond within 24 hours."
       },
       {
         question: "Can I use MyPet.rocks for any animal?",
         answer: "While we're built for pets (dogs and cats are our bread and butter), our styles work with many animals. We've done rabbits, hamsters, birds, horses, and even a bearded dragon. Upload a clear photo and give it a try!"
       }
     ]
   }
 ];
 
 export default function FAQ() {
   return (
     <>
       <Seo
         title="MyPet.Rocks FAQ - How It Works, Styles, Privacy, Refunds"
         description="How the free preview works, the 16+ art styles, photo tips, AI disclosure, privacy, pricing, prints, and refunds, all answered."
         path="/faq"
         jsonLd={faqPageSchema(faqData)}
       />
       <Header />
       <main className="pt-14 min-h-screen bg-background">
         <div className="container max-w-3xl mx-auto px-4 py-16">
           <h1 className="text-3xl md:text-4xl font-display text-primary mb-8">
             Frequently Asked Questions
           </h1>
 
           <div className="space-y-10">
             {faqData.map((section, sectionIndex) => (
               <section key={sectionIndex}>
                 <h2 className="text-xl font-display text-foreground mb-4 border-b border-border/30 pb-2">
                   {section.category}
                 </h2>
                 <Accordion type="single" collapsible className="w-full">
                   {section.items.map((item, itemIndex) => (
                     <AccordionItem
                       key={itemIndex}
                       value={`${sectionIndex}-${itemIndex}`}
                       className="border-border/30"
                     >
                       <AccordionTrigger className="text-left text-foreground/90 hover:text-primary hover:no-underline">
                         {item.question}
                       </AccordionTrigger>
                       <AccordionContent className="text-muted-foreground leading-relaxed">
                         {item.answer}
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
               </section>
             ))}
           </div>
 
           <div className="mt-12 pt-8 border-t border-border/30 text-center">
             <p className="text-muted-foreground italic">
               Didn't find your answer? Email us at{" "}
               <a href="mailto:woof@mypet.rocks" className="text-primary hover:underline">
                 woof@mypet.rocks
               </a>{" "}
               — we're always happy to help.
             </p>
           </div>
         </div>
       </main>
       <Footer />
     </>
   );
 }