import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-card rounded-lg shadow-lg p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground text-center">會員申請 / 查詢</h1>
          <p className="text-muted-foreground text-base md:text-lg text-center">
            請先選擇新會員或舊會員流程。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <section className="rounded-lg border border-border p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">新會員</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                請先選擇會員類別，再進入申請表。
              </p>
            </div>

            <div className="grid gap-4">
              <Button asChild className="text-lg py-6">
                <Link to="/apply?type=general">一般會員</Link>
              </Button>
              <Button asChild className="text-lg py-6">
                <Link to="/apply?type=elderly">長者會員</Link>
              </Button>
              <Button asChild className="text-lg py-6">
                <Link to="/apply?type=family">家庭會員</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-border p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">舊會員</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                查詢並更新現有會員資料。
              </p>
            </div>

            <Button asChild variant="outline" className="w-full text-lg py-6">
              <Link to="/lookup">舊會員查詢 / 更新</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Landing;
