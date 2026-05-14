Everstory Product Structure — Business Lock v2
Summary
기존 Solo / Duo / Trio / Memory Pack 구조는 폐기하고, 상품 축을 스티커 형태 + 큐레이션 정도로 재정립한다.
런칭 상품은 Face Sticker, Full Body Sticker, Circle Sticker, Mix Mini, Mix Full 5종.
지금은 비즈니스 상품 구조만 확정한다. 구현, 스크립트, 문서 업데이트는 후속 작업이다.
Product Lineup
Product	Customer promise	Designs	Sheets	Price
Face Sticker	얼굴/상반신 중심 다이컷	1+	size/cap 기준	from $15.99
Full Body Sticker	전신/전체 피사체 중심 다이컷	1+	size/cap 기준	from $15.99
Circle Sticker	원형 크롭 스티커	1+	size/cap 기준	from $15.99
Mix Mini	작은 curated mix set	4 featured	2 A5 sheets	$24.99
Mix Full	큰 curated mix set	8 featured	3 A5 sheets	$32.99
Mix Rules
Mix는 고객이 사이즈/형태를 세부 지정하는 상품이 아니라, Everstory가 사진을 보고 구성하는 curated pack이다.
Mix Mini: 고객이 5-6 photos 업로드 → Everstory가 best 4 designs feature → 2 sheets 제작.
Mix Full: 고객이 9-10 photos 업로드 → Everstory가 best 8 designs feature → 3 sheets 제작.
고객은 각 사진에 Importance tag를 줄 수 있다:
Hero: 크게/중심적으로, 품질 가능하면 반드시 feature
Medium: 적당히 중요
Small: 작아도 괜찮음
Studio choose: Everstory 판단
아무 tag도 없으면 Everstory가 자동 분배한다:
Mix Mini: 1 Hero / 1 Medium / 2 Small
Mix Full: 2 Hero / 2 Medium / 4 Small
Mix의 crop, format, size, layout은 curator 결정이다.
Photo QC Rules
숫자 기준은 두지 않는다. QC는 시각 기준으로 판단한다.
좋은 사진 기준:
피사체가 선명함
얼굴/대상이 너무 작지 않음
너무 어둡거나 흐릿하지 않음
잘린 부분이 결과물에 큰 문제가 없음
Buffer 원칙:
feature count를 채울 만큼 usable photos가 있으면 이메일 없이 진행.
Hero tag 사진이 품질 불가하면 교체 요청.
usable photos가 feature count보다 적으면 이메일로 replacement 요청.
고객-facing 문구는 짧게 둔다:
Upload a few extra photos. We choose the best ones for your final sheets.
If a main photo is too blurry or too small to print well, we’ll contact you before production.
Pricing Notes
Mix Mini $24.99, Mix Full $32.99는 launch-friendly 가격이다.
이 가격이면 Mix는 premium upsell보다는 “curated value pack”에 가깝다.
Mix Full이 8 designs / 3 sheets인데 $32.99라서, 비-Mix 다중 디자인 상품보다 저렴하게 느껴질 수 있다. 따라서 고객-facing 메시지는 “정교한 개별 지정”이 아니라 “Everstory가 고르는 curated mix”로 명확히 분리한다.
비-Mix 상품은 기본 1 design $15.99, 추가 디자인 +$3를 임시 기준으로 둔다.
Assumptions
Material은 현재 4종 유지: White Matte / Pearl Grey / Silver / Gold.
White Waterproof 추가 여부는 후속 결정.
전신 상품은 M 이상 권장 문구로 관리하되, 선택 차단은 하지 않는다.
Mix는 고객이 모든 디테일을 지정하는 상품이 아니라, 우선순위와 분위기만 주는 상품이다.