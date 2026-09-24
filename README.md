# arasta · OpenPencil

Türkçe, kurgusal B2B pazar yeri. **open-pencil/open-pencil 0.15.1** native CLI / Figma API ile çizildi. Bu depo ZSeven koşusundan ayrıdır.

- [Canlı cihaz laboratuvarı](https://karacaismail.github.io/arasta-open-pencil/)
- [Ölçüm ve uyum raporu](https://karacaismail.github.io/arasta-open-pencil/rapor/)
- [Native arasta.fig](design/arasta.fig)
- [1420’deki OpenPencil’de aç](http://localhost:1420/?file=https%3A%2F%2Fkaracaismail.github.io%2Farasta-open-pencil%2Fdesign%2Farasta.fig&node=Screen%2Fmobil-dikey%2F390%2Fana-sayfa)

22 sayfa × 22 ekran = **484 ayrı ekran**, 8 cihaz ailesi. 320×480 önce oluşturuldu. Telefon dikey/yatay, tablet dikey/yatay, masaüstü, 5K, 8K ve TV ayrı düzenler kullanır. Viewer canlı iframe, gerçek cihaz boyutu, sığdır/100%, paylaşılabilir hash ve tarayıcı geçmişi içerir.

## Doğrulama

- 484/484 web ekranı: taşma, 16px altı metin, 12px üstü radius, etiketsiz alan, başlık ve hedef boyutu kontrollerinden geçti.
- 50 temsilî axe taraması, 17 etkileşim testi, 5 QR telefon yönlendirmesi.
- OpenPencil FIG kaydet/aç döngüsünde 484/484 geometri/metin/renk/bileşen özeti eşleşti.
- 664 ürün kartı master değişikliği, override temizliğinden sonra 976/976 örneğe yayıldı.
- Strict native lint uyarıları sürüyor. Figma uygulamasında dosyanın açılması doğrulanmadı; tam WCAG sertifikasyonu iddia edilmiyor.

Ödeme, hesap, şirket doğrulama ve AI davranışları etkileşimli örnektir; canlı servislere bağlı değildir. Native tasarım, font ve form rasterizasyonu nedeniyle web ile tam piksel eşitliği iddia etmez.

## Yapı

| Dizin | İçerik |
|---|---|
| `design/` | Native `.fig`, native graph projeksiyonu, gerçek token/JSX export ve CLI çizim programları |
| `web/` | Bağımlılıksız HTML/CSS/JS kaynak, 484 ekran ve viewer |
| `docs/` | `main:/docs` üzerinden yayınlanan Pages çıktısı |
| `measurements/` | Ham çağrılar, 3 tur inceleme, audit, görüntüler, metrikler ve 20 boyutlu karşılaştırma |

## Yerel çalışma

Frontend için Node veya paket yüklemesi gerekmez:

```sh
python3 -m http.server 8000 --directory web
```

Native graph projeksiyonundan webi yeniden oluşturmak:

```sh
python3 web/tools/viewer.py
python3 web/tools/export_frontend.py
```

Tasarımı OpenPencil’de `design/arasta.fig` üzerinden düzenleyin. `design/authoring/` içindeki programlar üretimde kullanılan native API çağrılarıdır; araç 0.15.1 kaynak ağacı, Bun, CanvasKit fontları ve `/work/repo` çıktı dizini olan Linux worker ortamını varsayar. İşlem sırası `first` (ilk 320 checkpoint), boş belgeden `round2`, `layout-canonical`, `finish-with-qr`, `final-fixes`, `replace-rows`, `chart-fix`, `qr-fix`, `state-library`, `state-focus-fix`, `visual-fixes`, `start-page`; ardından `project`, `audit`, `export-evidence`. Hiçbir aşama çizilmiş bir SVG/PNG/HTML tasarımını içe aktarmaz.

## Ölçüm sınırı ve köken

Çağrı günlüğü zaman ölçümü eklenmiş native CLI çağrılarını ve son web sayfa auditlerini kapsar; ilk keşif, Git ve dosya kopyalama komutlarının süresi ölçülmedi. CLI gövde başarısı MCP gövde limiti olarak sunulmaz. Frame p50/p95 dosya IO ve sonradan yapılan onarımları hariç tutar. Native geometri sorunlarının çözümü için ölçüye özel masterlar gerekti; yaklaşık 600 component hedefi aşıldı. Ayrıntılar [raporda](measurements/REPORT.md).

Türkçe kurgusal içerik ve bazı frontend/test yardımcıları yazarın önceki kendi denemesinden yeniden kullanıldı; bu koşunun tasarımı native OpenPencil çağrılarıyla yeniden çizildi. [Penpot referansı](https://karacaismail.github.io/arasta-penpot-mcp/) yalnızca karşılaştırma için incelendi; dosyaları, kodu veya görselleri alınmadı. Penpot karşılaştırması eş koşullarda yeni benchmark değildir.

## Lisans

Proje [MIT](LICENSE). Phosphor ikonları MIT. Dağıtılan Roboto ve Roboto Mono fontları **OFL-1.1**; briefteki Apache varsayımı yerine gerçek font lisansları korunmuştur. Üçüncü taraf lisansları `web/assets/*-LICENSE.txt` içindedir.
