# arasta · OpenPencil ölçüm raporu

Tarih: 24 Eylül 2026. Kaynak: open-pencil/open-pencil 0.15.1. Bu koşu ZSeven değildir.

484 ekran, 104,058 native düğüm, 7,542 master. 484/484 web QA; 17/17 etkileşim.

## Yöntem ve sınırlar

Native CLI calls since instrumentation; final Playwright page audits when available. Setup/discovery commands were not retroactively timed.

Figma uygulamasında açılış test edilmedi. WCAG uyumluluğu için otomatik kontroller tam insan denetiminin yerini almaz. Gerçek ödeme ve hesap servisi yoktur.

## Üç iyileştirme turu

### Tur 1 · 320 ve temeller

320×480 önce çizildi. Relative vector path ve font ölçümü sorunları görüldü; absolute path dönüşümü ve CanvasKit font ölçümü eklendi. İlk commit bu aşamayı saklar.

### Tur 2 · 484 ekran ve kaydet/aç

Aile bileşenleriyle 484 frame üretildi. Native audit, FIG tekrar açma ve ekran görüntüleriyle geometri bozulmaları bulundu. Ölçüye özel native masterlar, grafik satırları, dar tablet KPI kartları, TV QR konumu ve koyu tema gradyanı düzeltildi.

### Tur 3 · ana bileşen düzeltmesi

Ürün kartı sınırı 3:1 UI görünürlüğü için border.default tokenına bağlandı. Mevcut binding override’ları kaldırıldı; master sync sonucunun 976 örnekte korunduğu kaydet/aç ile doğrulandı. Son web regresyonu karşılaştırma çubuğu/TV çakışmasını da yakaladı.

## Bulgular

### UYUM · Yerel üretim

Boş belgeye OpenPencil 0.15.1 CLI / Figma API ile çizildi. PNG, SVG, HTML veya başka tasarım dosyası içe aktarılmadı. Phosphor path verisi native vectorPaths alanına yazıldı. Kanıt: [design/authoring/round2.js](https://github.com/karacaismail/arasta-open-pencil/blob/main/design/authoring/round2.js).

### UYUM · 320 önce

İlk Git aşaması yalnızca 320×480 ana sayfa, temel tokenlar ve kütüphanedir. Sonra 22 sayfa × 22 ekran üretildi. Kanıt: [measurements/first-checkpoint.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/first-checkpoint.json).

### UYUM · Ailelere özel düzen

8 aile; telefon alt navigasyonu, yatay telefon 96px rayı, tablet üst menüsü, masaüstü menüsü ve TV düzeni ayrı kuruldu. Kanıt: [web/catalog.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/web/catalog.json).

### UYUM · Native ekran denetimi

484 ekran: 0 font/radius/taşma/çökmüş katman/hedef/metin kontrastı sorunu; 46783/46783 solid fill değişkene bağlı. Gradyanlar iki uçta kontrol edildi. Bu test bütün WCAG ölçütlerinin insan denetiminin yerini almaz. Kanıt: [measurements/native-audit-final-summary.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/native-audit-final-summary.json).

### DİRENÇ · İç içe örnek geometri kaybı

.fig kaydet/aç işleminde örnek boyut geçersiz kılmaları master boyutuna dönüyordu. İlk genişletmede 12.467 yatay taşma ve 1.122 çökmüş katman saptandı. Yerel font ölçümü ve ölçüye özel gerçek master varyantları ile çözüldü; yaklaşık 600 bileşen hedefi aşıldı. Kanıt: [measurements/adaptive-variants.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/adaptive-variants.json).

### KISMİ · Bileşen ölçeği

7542 master, 26920 örnek, 153 gerçek COMPONENT_SET. 480 ek kontrol durumu matrisi var. Ölçüye özel master yaklaşımı görsel doğruluğu sağlıyor ancak kütüphane bakım maliyetini artırıyor. Kanıt: [measurements/state-library.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/state-library.json).

### UYUM · Üçüncü tur: master yayılımı

664 ProductCard masterında border.subtle → border.default. .fig içe alımından kalan 976 binding override temizlendikten sonra syncInstances çalıştırıldı. Örneklerde tek tek renk değeri yazılmadı. Yeniden açılışta 976/976 örnek doğru tokenı miras alıyor. Kanıt: [measurements/master-round3.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/master-round3.json).

### KISMİ · Varyant ve swap API

108 nested ikon slotuna 12 component adayı bağlandı. Gerçek varyant setleri kullanılabildi; Figma’daki tüm property/variant düzenleme davranışlarıyla tam eşdeğerlik iddia edilmiyor. Kanıt: [measurements/native-export-evidence.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/native-export-evidence.json).

### UYUM · Token dışa aktarımı

design_to_tokens aracı 125 değişkeni CSS, Tailwind tema ve JSON olarak verdi. CSS sınıf seçicileri data-theme/data-fam biçimine çevrildi; semantik adlar koleksiyon öneklerine alias oldu. Kanıt: [design/exports/tokens.css](https://github.com/karacaismail/arasta-open-pencil/blob/main/design/exports/tokens.css).

### KISMİ · Gradyan tema bağı

Native gradyan renk durakları solid fill gibi değişkene bağlanmadı. Hero duraklarının semantik isimleri native pluginData içinde saklandı; TV değerleri native dosyada çözüldü, webde CSS değişkenlerine çevrildi. Kanıt: [measurements/visual-fixes.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/visual-fixes.json).

### DİRENÇ · Lint uyarıları

Strict lint: 0 error, 77,876 warning. no-deeply-nested, pixel-perfect, no-detached-instances ve sembolleri de sayan touch-target-size öne çıkıyor. Ham sonuç sıkıştırılmış halde duruyor; lint temiz denmiyor. Kanıt: [measurements/native-audit-final.json.gz](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/native-audit-final.json.gz).

### UYUM · XPath

//TEXT[@fontSize < 16] sorgusu boş döndü. Frame kontrolleri ve strict linter ayrıca çalıştırıldı. Kanıt: [measurements/xpath-small-text.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/xpath-small-text.json).

### KISMİ · FIG round trip

OpenPencil → FIG → OpenPencil için 484/484 ekranın geometri, metin, renk ve bileşen referans adı hash’i aynı. Çıktı 1420 editöründe Linux Chromium ile açıldı. Figma uygulamasında açılış bu çalışmada doğrulanmadı. Kanıt: [measurements/roundtrip-after.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/roundtrip-after.json).

### KISMİ · JSX/Tailwind aktarımı

Native JSX export görünür metni ve stilleri aktarıyor, ancak h1 yerine p, link/button yerine div, form alanı yerine metin üretiyor. 320 ve 1440 örnekleri saklandı. Web, native graph projeksiyonundan semantik etiketlerle üretildi; otomatik JSX olduğu gibi yayınlanmadı. Kanıt: [design/exports/mobil-dikey-320-ana-sayfa.tsx](https://github.com/karacaismail/arasta-open-pencil/blob/main/design/exports/mobil-dikey-320-ana-sayfa.tsx).

### KISMİ · Görsel eşleşme

7 gerçek genişlikte ekran görüntüsü incelendi. Native ve web düzeni aynı belgeyi izliyor; browser form kontrolü ölçüsü, gradient rasterizasyonu ve aktif/focus durumları birebir piksel eşitliği sağlamıyor. Kanıt: [measurements/screenshots/](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/screenshots/).

### UYUM · Web kalite kontrolü

484/484 ekran geçiyor; tam bir h1, etiketli alanlar, en az 16px yazı, en fazla 12px radius, sıfır yatay taşma. 50 axe sayfasında 0 ihlal sayfası; gradyan gibi axe incomplete sonuçları insan incelemesiyle ayrıca ele alındı. Kanıt: [measurements/web-qa-final.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/web-qa-final.json).

### UYUM · Etkileşim ve TV

17/17 senaryo: miktar/kademe/landed cost, sepet, filtre, karşılaştırma, komut menüsü, tema, kayıt, RFQ, mesaj, parola, viewer geçmişi ve TV D-pad. Beş QR doğru telefon sayfasına çözülüyor. Oturumdaki karşılaştırma çubuğunun TV düğmesini örtmesi düzeltildi. Kanıt: [measurements/interactions.json](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/interactions.json).

### KISMİ · Kimlik ve işlem kapsamı

AI, şirket doğrulama, kimlik girişi, mesaj ve ödeme akışları etkileşimli prototiptir. Gerçek hesap, banka, tedarikçi, AI sağlayıcısı veya ödeme servisine bağlı değildir. Kanıt: [web/assets/app.js](https://github.com/karacaismail/arasta-open-pencil/blob/main/web/assets/app.js).

### UYUM · CLI toplu üretim

En büyük başarılı eval gövdesi 6,035,498 bayt. 484 ekran tek native API programında oluşturuldu. Bu sonuç MCP HTTP gövde sınırı ölçümü değildir. Kanıt: [measurements/calls.jsonl](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/calls.jsonl).

### DİRENÇ · CLI sonuç kesilmesi

Büyük JSON stdout çıktısı 196.608 baytta kesildiği halde süreç başarılı döndü. Büyük sonuçlar eval içinden Bun.write ile dosyaya yazılarak alındı. Kanıt: [measurements/calls.jsonl](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/calls.jsonl).

### KISMİ · MCP limitleri ve iptal

Bu koşu dosya tabanlı CLI kullandı. MCP batch gövdesi, iptal ve hidden-tab heartbeat canlı ölçülmedi. Yerel 0.15.1 kaynak incelemesi: 900.000 bayt sonuç bütçesi; browser RPC 20sn, bridge 35sn zaman aşımı. Bunlar CLI sınırı değildir. Kanıt: [https://github.com/open-pencil/open-pencil/tree/main/packages/mcp](https://github.com/open-pencil/open-pencil/tree/main/packages/mcp).

### KISMİ · Çağrı günlüğü

calls.jsonl zaman ölçümü eklenmiş native CLI çağrılarını ve son web sayfa auditlerini içerir. İlk keşif, dosya kopyalama, Git ve kurulum komutları bu gecikme veri kümesine dahil değildir; geriye dönük süre uydurulmadı. Kanıt: [measurements/calls.jsonl](https://github.com/karacaismail/arasta-open-pencil/blob/main/measurements/calls.jsonl).

## 20 boyutlu karşılaştırma

Penpot sütunu verilen briefteki örnekleri ve hedefleri gösterir; aynı koşullarda yeniden çalıştırılmış karşılaştırmalı benchmark değildir. Referans dosya, kod veya görseli kopyalanmadı.

| Boyut | Penpot / brief | OpenPencil | Durum |
|---|---|---|---|
|Kurulum|Penpot sunucusu + MCP|Mevcut Colima imajı, ayrı Linux CLI worker; servis restart yok|UYUM|
|Bağlantı|MCP bağlantısı|Dosya tabanlı CLI; web editörü ayrıca açılış için doğrulandı|UYUM|
|Arka plan|Briefte gizli sekme heartbeat kaybı örneği|CLI sekme/masaüstü odağı istemiyor; MCP heartbeat yeniden test edilmedi|KISMİ|
|Ölçek|22×22 ve ~600 hedefi|484 ekran / 104058 düğüm; 7542 master|KISMİ|
|Master / örnek|Ana bileşen yayılımı beklentisi|976/976 miras, önce override temizliği gerekti|KISMİ|
|Varyant|Briefte grupta tek component listeleme örneği|Gerçek COMPONENT_SET + 480 durum matrisi; tam Figma property parity yok|KISMİ|
|Vektör / ikon|Native Phosphor path şartı|Göreli path komutları kabul edilmedi; mutlak komutlara çevrildi|KISMİ|
|Auto layout|Briefte hug/fill çökmesi ve resize yan etkisi|FIG iç içe override kaybı; font ölçümü + ölçülü master ile onarıldı|DİRENÇ|
|Token / tema|Light/Dark, 8 cihaz|125 native variable; 4 koleksiyon; renk, cihaz, foundation, typography|UYUM|
|Font|Briefte fuzzy font lookup örneği|Roboto / Mono hazırlandı; font measurer yüklenmeden metin ölçüsü güvenilir değil|KISMİ|
|Kod export|Statik frontend hedefi|Native JSX/Tailwind görünümü taşır, HTML semantiği elle eşlendi|KISMİ|
|Native round trip|Bu koşuda Penpot round trip ölçülmedi|OpenPencil hash 484/484; Figma uygulaması doğrulanmadı|KISMİ|
|Git farkları|JSON tabanlı veri karşılaştırması beklentisi|FIG binary; projection.json ve authoring JS metin olarak diff edilebilir|KISMİ|
|XPath / lint|Adlandırma, layout, erişilebilirlik auditleri|XPath çalıştı; strict lint 0 error, çok sayıda warning|KISMİ|
|Batch sınırı|Brief örneği: 100KB gövde|CLI 6.035.498 bayt başarılı; MCP gövde sınırı ölçülmedi|KISMİ|
|Timeout / iptal|Brief örneği: 120sn, iptal yok|Native CLI süreci kontrol edilebilir; MCP cancellation/queue canlı test yok|KISMİ|
|Gizli çalışma|Brief örneği: hidden-tab kopması|Linux headless tasarım ve QA; kullanıcının masaüstü kullanılmadı|UYUM|
|Dosya adı|Brief örneği: yeniden adlandıramama|CLI çıktı dosya yolu seçilebiliyor; arasta.fig kaydedildi|UYUM|
|Hata açıklığı|Brief örnekleri: boş metin/font hataları|Açık path/import hataları; stdout kesilmesi exit 0 ile geldi|DİRENÇ|
|Teslim ve semantik|484 URL + viewer + erişilebilirlik|484 HTML, canlı iframe/hash, QA ve açık sınırlamalar|UYUM|

## Değerlendirme

OpenPencil CLI, native vektör üretimi, büyük toplu çizim, değişkenler ve Linux arka plan akışında kullanılabilir. Bu deneyimde iç içe component geometry round trip, variant bakım maliyeti, stdout kesilmesi ve semantik kod export boşlukları denetimsiz kurumsal teslim için engel oluşturdu. Öneri: kalıcı instance override testleri, güvenilir stream/file çıktı, token bağlı gradient durakları ve semantik export eklenmesi. Figma uygulaması ve canlı MCP limitleri ayrıca doğrulanmalıdır.

## Lisans ve köken

Proje MIT; Phosphor MIT. Dağıtılan Roboto ve Roboto Mono dosyalarının beraberindeki lisansları OFL-1.1’dir; briefteki Apache varsayımıyla yeniden etiketlenmedi. Türkçe kurgusal örnek veri ve bazı frontend/test yardımcıları yazarın önceki kendi denemesinden yeniden kullanıldı; tasarım native OpenPencil API çağrılarıyla yeniden çizildi. Penpot referansı yalnızca karşılaştırma bağlamıdır.
