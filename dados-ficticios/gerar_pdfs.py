# Gera relatórios semanais FICTÍCIOS no formato lido por server/src/parser.js
import random, datetime, os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white

random.seed(42)
NOMES = ["LunaVibes","Kaique Live","Mel Sorriso","DJ Nando","Bia Star","Rafa Gamer","Nina Rocha","Theo Sunset",
 "Lari Moon","Duda Fit","Gabi Pop","Leo Zen","Malu Rosa","Caio Night","Isa Glow","Juju Café","Pedro Beat",
 "Clara Neon","Vini Riso","Tati Lua","Biel Fire","Sofi Art","Davi Chef","Lia Dance","Rick Vibe","Manu Doce",
 "Fer Sky","Yasmin K","Otto Play","Ana Brisa"]
FAIXAS=[("Diamante",500_000),("Ouro",120_000),("Prata",50_000),("Bronze",0)]
SAL={"Diamante":36,"Ouro":24,"Prata":12,"Bronze":6}
def classe(d): return next(n for n,m in FAIXAS if d>=m)

hosts=[]
ids=set()
for i,n in enumerate(NOMES):
    while True:
        hid=str(random.randint(10_000_000,49_999_999))
        if hid not in ids: ids.add(hid);break
    base=int(2_400_000*(0.78**i)*random.uniform(0.85,1.15))+random.randint(15_000,40_000)
    hosts.append({"id":hid,"nome":n,"base":base,"horas":random.uniform(14,52)})

INICIOS=[datetime.date(2026,10,19)+datetime.timedelta(weeks=k) for k in range(4)]
TREND=[0.86,0.93,0.97,1.06]
semanas=[]
for k,ini in enumerate(INICIOS):
    linhas=[]
    for i,h in enumerate(hosts):
        mult=TREND[k]*random.uniform(0.82,1.2)
        d=int(h["base"]*mult); horas=round(h["horas"]*random.uniform(0.85,1.15),2); dias=6
        if random.random()<0.08: dias=random.choice([5,6])
        # casos especiais (geram alertas) na última semana
        if k==3:
            if h["nome"]=="Otto Play": d,horas,dias=0,0,0
            if h["nome"]=="Fer Sky": dias=4; horas=round(horas*0.6,2); d=int(d*0.6)
            if h["nome"]=="Tati Lua": d=int(h["base"]*0.5)   # queda forte
            if h["nome"]=="Davi Chef": dias=3; horas=round(horas*0.5,2)
        cl=classe(d)
        sal=SAL[cl] if dias>=6 else 0
        if k==3 and h["nome"]=="Leo Zen": sal=0  # conferir pagamento
        linhas.append({"id":h["id"],"nome":h["nome"],"diamantes":d,"horas":horas if dias else 0,"dias":dias,"salario":sal,"classe":cl})
    linhas.sort(key=lambda r:-r["diamantes"])
    semanas.append((ini,linhas))

def milhar(n): return f"{n:,}".replace(",",".")
INK=HexColor("#14121f"); ROSA=HexColor("#ff3d81"); CINZA=HexColor("#6b6880"); ZEBRA=HexColor("#f5f3fa"); LINHA=HexColor("#e4e1ee")
for n,(ini,linhas) in enumerate(semanas):
    fim=ini+datetime.timedelta(days=6)
    nome=f"Planilha de Pagamento Semana {ini:%d-%m} a {fim:%d-%m} ({43+n}).pdf"
    W,H=A4; c=canvas.Canvas(os.path.join(os.path.dirname(os.path.abspath(__file__)),nome),pagesize=(W,H))
    c.setTitle(f"Planilha de Pagamento - Semana {ini:%d/%m} a {fim:%d/%m}")
    c.setFillColor(INK); c.rect(0,H-78,W,78,fill=1,stroke=0)
    c.setFillColor(ROSA); c.rect(0,H-81,W,3,fill=1,stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold",18); c.drawString(36,H-42,"Planilha de Pagamento Semanal")
    c.setFont("Helvetica",10.5); c.setFillColor(HexColor("#c9c5dc"))
    c.drawString(36,H-62,f"Agência Nova Onda  ·  Plataforma Alii  ·  Semana {ini:%d/%m} a {fim:%d/%m/%Y}")
    c.setFont("Helvetica-Bold",9); c.setFillColor(ROSA); c.drawRightString(W-36,H-42,"DADOS FICTÍCIOS")
    c.setFont("Helvetica",8.5); c.setFillColor(HexColor("#c9c5dc")); c.drawRightString(W-36,H-58,"Gerado para demonstração de portfólio")
    cols=[("ID",36,"l"),("Nome",100,"l"),("Diamantes",292,"r"),("Horas",352,"r"),("Dias Válidos",420,"r"),("Salário (USD)",490,"r"),("Classificação",502,"l")]
    y=H-112
    c.setFillColor(HexColor("#ece9f5")); c.rect(28,y-7,W-56,22,fill=1,stroke=0)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",9)
    for t,x,a in cols:
        (c.drawRightString if a=="r" else c.drawString)(x,y,t)
    y-=22
    c.setFont("Helvetica",9.5)
    for i,r in enumerate(linhas):
        if i%2==0: c.setFillColor(ZEBRA); c.rect(28,y-6,W-56,17,fill=1,stroke=0)
        c.setFillColor(INK)
        vals=[r["id"],r["nome"],milhar(r["diamantes"]),(f'{r["horas"]:.2f} h' if r["horas"] else "0"),str(r["dias"]),str(r["salario"]),r["classe"]]
        for (t,x,a),v in zip(cols,vals):
            (c.drawRightString if a=="r" else c.drawString)(x,y,v)
        y-=17
    y-=6; c.setStrokeColor(LINHA); c.line(28,y+10,W-28,y+10)
    c.setFont("Helvetica-Bold",9.5)
    c.drawString(100,y-4,"Total"); c.drawRightString(292,y-4,milhar(sum(r["diamantes"] for r in linhas)))
    c.drawRightString(352,y-4,f'{sum(r["horas"] for r in linhas):.2f} h'.replace(".",","))
    c.drawRightString(490,y-4,f'US$ {sum(r["salario"] for r in linhas)}')
    c.setFont("Helvetica",7.5); c.setFillColor(CINZA)
    c.drawString(36,24,"1 diamante = 750 pontos · 12.000.000 de pontos = US$ 20 · Salário exige 6 dias válidos.")
    c.drawRightString(W-36,24,"Página 1 de 1")
    c.save(); print(nome,len(linhas))
