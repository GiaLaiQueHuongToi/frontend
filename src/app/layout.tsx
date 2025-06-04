import ReduxProvider from "@/store/ReduxProvider";
import TextRedux from "@/components/TestRedux";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <ReduxProvider>
                    <div>
                        <header>
                            <h1>My App</h1>
                            <TextRedux />
                        </header>
                        <main>
                            {children}
                        </main>
                    </div>
                </ReduxProvider>
            </body>
        </html>
    )
}