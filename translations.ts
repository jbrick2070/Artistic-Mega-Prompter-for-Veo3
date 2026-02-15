
export type Language = 'en' | 'es' | 'ja' | 'vi' | 'ko' | 'ar';

export interface TranslationSet {
  gallery: string;
  cast: string;
  studio: string;
  export: string;
  archive: string;
  enter_studio: string;
  magic_director: string;
  restore_sample: string;
  new_mooovie: string;
  processing: string;
  memory_stable: string;
  open_source: string;
  cast_bank: string;
  shot_architect: string;
  timeline: string;
  export_studio: string;
  production_assembly: string;
  assemble_script: string;
  export_images: string;
  working_title: string;
  action_btn: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    gallery: "Gallery",
    cast: "Cast",
    studio: "Studio",
    export: "Export",
    archive: "Studio Archive",
    enter_studio: "Enter Studio",
    magic_director: "Magic Director",
    restore_sample: "Restore Sample",
    new_mooovie: "Action! New Mooovie",
    processing: "Processing...",
    memory_stable: "Memory Stable",
    open_source: "Open Source",
    cast_bank: "Cast Bank",
    shot_architect: "Shot Architect",
    timeline: "Timeline",
    export_studio: "Export Studio",
    production_assembly: "Production Assembly",
    assemble_script: "Assemble Master Script",
    export_images: "Export Image Pack",
    working_title: "Working Title",
    action_btn: "Action!"
  },
  es: {
    gallery: "Galería",
    cast: "Elenco",
    studio: "Estudio",
    export: "Exportar",
    archive: "Archivo del Estudio",
    enter_studio: "Entrar al Estudio",
    magic_director: "Director Mágico",
    restore_sample: "Restaurar Muestra",
    new_mooovie: "¡Acción! Nueva Película",
    processing: "Procesando...",
    memory_stable: "Memoria Estable",
    open_source: "Código Abierto",
    cast_bank: "Banco de Elenco",
    shot_architect: "Arquitecto de Tomas",
    timeline: "Línea de Tiempo",
    export_studio: "Estudio de Exportación",
    production_assembly: "Ensamblaje de Producción",
    assemble_script: "Ensamblar Guion Maestro",
    export_images: "Exportar Pack de Imágenes",
    working_title: "Título de Trabajo",
    action_btn: "¡Acción!"
  },
  ja: {
    gallery: "ギャラリー",
    cast: "キャスト",
    studio: "スタジオ",
    export: "書き出し",
    archive: "スタジオアーカイブ",
    enter_studio: "スタジオに入る",
    magic_director: "マジックディレクター",
    restore_sample: "サンプルを復元",
    new_mooovie: "アクション！新しい映画",
    processing: "処理中...",
    memory_stable: "メモリ安定",
    open_source: "オープンソース",
    cast_bank: "キャストバンク",
    shot_architect: "ショットアーキテクト",
    timeline: "タイムライン",
    export_studio: "エクスポートスタジオ",
    production_assembly: "制作アセンブリ",
    assemble_script: "マスタースクリプト作成",
    export_images: "画像パック出力",
    working_title: "仮題",
    action_btn: "アクション！"
  },
  vi: {
    gallery: "Bộ sưu tập",
    cast: "Dàn nhân vật",
    studio: "Phòng thu",
    export: "Xuất bản",
    archive: "Lưu trữ phòng thu",
    enter_studio: "Vào phòng thu",
    magic_director: "Đạo diễn ảo",
    restore_sample: "Khôi phục mẫu",
    new_mooovie: "Diễn! Phim mới",
    processing: "Đang xử lý...",
    memory_stable: "Bộ nhớ ổn định",
    open_source: "Mã nguồn mở",
    cast_bank: "Kho nhân vật",
    shot_architect: "Kiến trúc cảnh quay",
    timeline: "Dòng thời gian",
    export_studio: "Xưởng xuất bản",
    production_assembly: "Lắp ráp sản xuất",
    assemble_script: "Lập kịch bản gốc",
    export_images: "Xuất gói hình ảnh",
    working_title: "Tiêu đề dự kiến",
    action_btn: "Diễn!"
  },
  ko: {
    gallery: "갤러리",
    cast: "캐스트",
    studio: "스튜디오",
    export: "내보내기",
    archive: "스튜디오 아카이브",
    enter_studio: "스튜디오 입장",
    magic_director: "매직 디렉터",
    restore_sample: "샘플 복원",
    new_mooovie: "액션! 새로운 영화",
    processing: "처리 중...",
    memory_stable: "메모리 안정",
    open_source: "오픈 소스",
    cast_bank: "캐스트 뱅크",
    shot_architect: "샷 아키텍트",
    timeline: "타임라인",
    export_studio: "내보내기 스튜디오",
    production_assembly: "프로덕션 어셈블리",
    assemble_script: "마스터 스크립트 조립",
    export_images: "이미지 팩 내보내기",
    working_title: "작업 제목",
    action_btn: "액션!"
  },
  ar: {
    gallery: "المعرض",
    cast: "طاقم العمل",
    studio: "الاستوديو",
    export: "تصدير",
    archive: "أرشيف الاستوديو",
    enter_studio: "دخول الاستوديو",
    magic_director: "المخرج السحري",
    restore_sample: "استعادة العينة",
    new_mooovie: "أكشن! فيلم جديد",
    processing: "جاري المعالجة...",
    memory_stable: "الذاكرة مستقرة",
    open_source: "المصدر المفتوح",
    cast_bank: "بنك الطاقم",
    shot_architect: "مهندس اللقطات",
    timeline: "الخط الزمني",
    export_studio: "استوديو التصدير",
    production_assembly: "تجميع الإنتاج",
    assemble_script: "تجميع النص الرئيسي",
    export_images: "تصدير حزمة الصور",
    working_title: "عنوان العمل",
    action_btn: "أكشن!"
  }
};
