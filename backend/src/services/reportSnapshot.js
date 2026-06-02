// 리포트 스냅샷 객체 빌더 — 제출 시점 데이터의 불변 복사본을 만든다.
// 반환 객체는 route에서 JSON.stringify되어 report_snapshots에 저장된다.
// report.id는 reportId 확정 후(insert 이후) 주입되므로 여기서 설정하지 않는다.

export function buildSnapshot({ inspection, unit, participants, grade, aiGuide, createdAt }) {
  return {
    report: {
      grade,
      createdAt: createdAt ?? new Date().toISOString(),
    },
    inspection: {
      id: inspection.id,
      type: inspection.inspectionType,
      flow: inspection.flow,
      inspectedAt: inspection.inspectedAt,
      status: 'reported',
    },
    unit,
    participants,
    items: (inspection.items ?? []).map((i) => ({
      space: i.space,
      detailItem: i.detailItem,
      state: i.state,
      category: i.category,
      problemItem: i.problemItem,
      location: i.location,
      description: i.description,
    })),
    observations: (inspection.observations ?? []).map((o) => ({
      inspectionItemId: o.inspectionItemId,
      observationKey: o.observationKey,
      value: o.value,
      note: o.note,
    })),
    images: (inspection.images ?? []).map((im) => ({
      base64Data: im.base64Data,
      mimeType: im.mimeType,
      photoType: im.photoType,
      caption: im.caption,
      sizeBytes: im.sizeBytes,
    })),
    aiGuide: aiGuide ?? null,
    finalOpinion: inspection.finalOpinion ?? null,
    caution: '본 리포트는 점검 기록 보조용이며 법적 책임 판단 자료가 아닙니다.',
  };
}
