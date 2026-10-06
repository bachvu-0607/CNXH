import { BoardSquare } from '../types/game';

export const BOARD_SQUARES: BoardSquare[] = [
  {
    id: 1,
    name: 'BẮT ĐẦU – NHÂN DÂN LÀM CHỦ',
    category: 'start',
    subtitle: 'Xuất phát điểm của hành trình dân chủ',
    questions: [
      {
        id: 'q_1_1',
        text: 'Khẩu hiệu cốt lõi của nền dân chủ Xã hội Chủ nghĩa là gì?',
        answer: 'Dân là chủ và Dân làm chủ.',
        points: 1,
      },
      {
        id: 'q_1_2',
        text: 'Bản chất cao nhất của nền dân chủ XHCN là quyền lực thuộc về ai?',
        answer: 'Thuộc về toàn thể Nhân dân.',
        points: 1,
      },
      {
        id: 'q_1_3',
        text: 'Nền dân chủ XHCN đặt dưới sự lãnh đạo của tổ chức chính trị nào?',
        answer: 'Đảng Cộng sản Việt Nam (Đảng của giai cấp công nhân).',
        points: 1,
      },
      {
        id: 'q_1_4',
        text: 'Nhà nước bảo đảm quyền làm chủ của nhân dân là nhà nước gì?',
        answer: 'Nhà nước pháp quyền xã hội chủ nghĩa của nhân dân, do nhân dân, vì nhân dân.',
        points: 1,
      },
    ],
  },
  {
    id: 2,
    name: 'KIẾN THỨC: KHÁI NIỆM DÂN CHỦ',
    category: 'knowledge',
    subtitle: 'Nguồn gốc và bản chất khái niệm dân chủ',
    questions: [
      {
        id: 'q_2_1',
        text: 'Theo tư tưởng Hồ Chí Minh được giáo trình trình bày, dân chủ được diễn đạt ngắn gọn bằng hai vế nào?',
        answer: 'Dân là chủ và dân làm chủ.',
        points: 1,
      },
      {
        id: 'q_2_2',
        text: 'Dân chủ có thể được tiếp cận dưới ba tư cách cơ bản nào?',
        answer: 'Một giá trị xã hội; một phạm trù chính trị; một phạm trù lịch sử.',
        points: 1,
      },
      {
        id: 'q_2_3',
        text: 'Dân chủ với tư cách một giá trị xã hội phản ánh điều gì?',
        answer: 'Những quyền cơ bản của con người.',
        points: 1,
      },
      {
        id: 'q_2_4',
        text: 'Theo giáo trình, dân chủ phải bao quát những lĩnh vực chủ yếu nào của đời sống?',
        answer: 'Kinh tế, chính trị, xã hội và văn hóa – tinh thần – tư tưởng.',
        points: 1,
      },
    ],
  },
  {
    id: 3,
    name: 'PHÁT TRIỂN KINH TẾ BỀN VỮNG',
    category: 'economy',
    subtitle: 'Cơ sở kinh tế của nền dân chủ',
    questions: [
      {
        id: 'q_3_1',
        text: 'Trong các lĩnh vực dân chủ, giáo trình coi dân chủ trên lĩnh vực nào là cơ sở?',
        answer: 'Dân chủ trên lĩnh vực kinh tế.',
        points: 1,
      },
      {
        id: 'q_3_2',
        text: 'Bản chất kinh tế của nền dân chủ XHCN hướng tới thỏa mãn ngày càng cao nhu cầu của ai?',
        answer: 'Toàn thể nhân dân lao động.',
        points: 1,
      },
      {
        id: 'q_3_3',
        text: 'Quyền làm chủ về kinh tế của nhân dân được thể hiện trước hết ở quyền làm chủ đối với những gì?',
        answer: 'Những tư liệu sản xuất chủ yếu của xã hội.',
        points: 1,
      },
      {
        id: 'q_3_4',
        text: 'Vì sao lợi ích kinh tế của người lao động có ý nghĩa đối với phát triển kinh tế – xã hội?',
        answer: 'Vì giáo trình coi đó là một động lực cơ bản thúc đẩy kinh tế – xã hội phát triển.',
        points: 1,
      },
    ],
  },
  {
    id: 4,
    name: 'PHÁP LUẬT',
    category: 'law',
    subtitle: 'Kỷ luật, kỷ cương và thể chế hóa',
    questions: [
      {
        id: 'q_4_1',
        text: 'Dân chủ và pháp luật trong nền dân chủ XHCN có quan hệ như thế nào?',
        answer: 'Nằm trong sự thống nhất biện chứng.',
        points: 1,
      },
      {
        id: 'q_4_2',
        text: 'Dân chủ phải đi đôi với những yêu cầu nào để bảo đảm trật tự xã hội?',
        answer: 'Kỷ luật và kỷ cương.',
        points: 1,
      },
      {
        id: 'q_4_3',
        text: 'Dân chủ phải được thể chế hóa và bảo đảm bằng gì?',
        answer: 'Pháp luật.',
        points: 1,
      },
      {
        id: 'q_4_4',
        text: 'Đúng hay sai: Có quyền dân chủ nghĩa là có thể hành động ngoài khuôn khổ pháp luật.',
        answer: 'Sai. Quyền dân chủ được thể chế hóa và bảo đảm bằng pháp luật, đồng thời gắn với kỷ luật, kỷ cương.',
        points: 1,
      },
    ],
  },
  {
    id: 5,
    name: 'TÌNH HUỐNG 1',
    category: 'scenario',
    subtitle: 'Vận dụng tổng hợp pháp luật & dân chủ',
    questions: [
      {
        id: 'q_5_1',
        text: 'Một người nói: “Tôi là chủ nên tôi muốn làm gì cũng được, không cần tuân thủ quy định chung”. Hãy nhận xét.',
        answer: 'Không đúng; dân chủ phải gắn với pháp luật, kỷ luật và kỷ cương.',
        points: 2,
      },
      {
        id: 'q_5_2',
        text: 'Một địa phương chuẩn bị quyết định vấn đề ảnh hưởng trực tiếp đến dân nhưng không tạo điều kiện để người dân tham gia ý kiến. Nội dung nào của dân chủ chưa được thể hiện đầy đủ?',
        answer: 'Quyền làm chủ và quyền tham gia quản lý nhà nước, xã hội của nhân dân.',
        points: 2,
      },
      {
        id: 'q_5_3',
        text: 'Một chính sách chỉ chú ý lợi ích của một nhóm nhỏ, bỏ qua lợi ích tập thể và xã hội. Theo bản chất xã hội của dân chủ XHCN cần điều chỉnh theo hướng nào?',
        answer: 'Kết hợp hài hòa lợi ích cá nhân, tập thể và toàn xã hội.',
        points: 2,
      },
      {
        id: 'q_5_4',
        text: 'Người lao động được tham gia quản lý sản xuất nhưng kết quả phân phối hoàn toàn không gắn với lao động. Nội dung nào cần xem xét?',
        answer: 'Bản chất kinh tế; phân phối lợi ích theo kết quả lao động là chủ yếu.',
        points: 2,
      },
    ],
  },
  {
    id: 6,
    name: 'THAM GIA QUẢN LÝ XÃ HỘI',
    category: 'politics',
    subtitle: 'Bản chất chính trị của dân chủ XHCN',
    questions: [
      {
        id: 'q_6_1',
        text: 'Việc nhân dân tham gia quản lý xã hội thể hiện trực tiếp phương diện bản chất nào của nền dân chủ XHCN?',
        answer: 'Bản chất chính trị.',
        points: 1,
      },
      {
        id: 'q_6_2',
        text: 'Theo giáo trình, sự tham gia rộng rãi của nhân dân vào công việc quản lý nhà nước được gọi là gì?',
        answer: 'Dân chủ về chính trị.',
        points: 1,
      },
      {
        id: 'q_6_3',
        text: 'Ngoài quản lý nhà nước, nhân dân còn thực hiện quyền làm chủ trong phạm vi nào?',
        answer: 'Trong toàn xã hội và các lĩnh vực của đời sống xã hội.',
        points: 1,
      },
      {
        id: 'q_6_4',
        text: 'Mục đích của việc thu hút ngày càng đông đảo nhân dân tham gia quản lý xã hội là gì?',
        answer: 'Để nhân dân thực sự thực hiện quyền làm chủ và tham gia tự giác vào quản lý nhà nước, quản lý xã hội.',
        points: 1,
      },
    ],
  },
  {
    id: 7,
    name: 'BẦU CỬ',
    category: 'politics',
    subtitle: 'Quyền bầu cử và ứng cử của công dân',
    questions: [
      {
        id: 'q_7_1',
        text: 'Việc nhân dân lựa chọn người đại diện cho mình thể hiện rõ nhất quyền làm chủ trên lĩnh vực nào?',
        answer: 'Chính trị.',
        points: 1,
      },
      {
        id: 'q_7_2',
        text: 'Bầu cử thể hiện rõ hơn vế “dân là chủ” hay “dân làm chủ”?',
        answer: 'Dân làm chủ, vì nhân dân trực tiếp thực hiện quyền chính trị của mình.',
        points: 1,
      },
      {
        id: 'q_7_3',
        text: 'Theo nội dung giáo trình, nhân dân có quyền giới thiệu những người nào tham gia vào bộ máy chính quyền?',
        answer: 'Những đại biểu của mình.',
        points: 1,
      },
      {
        id: 'q_7_4',
        text: 'Thông qua đại diện do nhân dân lựa chọn và các hình thức dân chủ trực tiếp, nguyên tắc cốt lõi nào được bảo đảm?',
        answer: 'Quyền lực thuộc về nhân dân.',
        points: 1,
      },
    ],
  },
  {
    id: 8,
    name: 'KIẾN THỨC: SỰ RA ĐỜI VÀ PHÁT TRIỂN CỦA DÂN CHỦ',
    category: 'knowledge',
    subtitle: 'Lịch sử phát triển các nền dân chủ',
    questions: [
      {
        id: 'q_8_1',
        text: 'Hình thức dân chủ sơ khai trong xã hội cộng sản nguyên thủy còn được gọi là gì?',
        answer: 'Dân chủ nguyên thủy / dân chủ quân sự.',
        points: 1,
      },
      {
        id: 'q_8_2',
        text: 'Trong xã hội chiếm hữu nô lệ xuất hiện nền dân chủ của giai cấp nào?',
        answer: 'Dân chủ chủ nô.',
        points: 1,
      },
      {
        id: 'q_8_3',
        text: 'Nền dân chủ XHCN chính thức được xác lập sau sự kiện nào?',
        answer: 'Sau thắng lợi của Cách mạng Tháng Mười Nga năm 1917 và sự ra đời của nhà nước XHCN đầu tiên.',
        points: 1,
      },
      {
        id: 'q_8_4',
        text: 'Nền dân chủ XHCN phát triển theo xu hướng nào?',
        answer: 'Từ thấp đến cao, từ chưa hoàn thiện đến hoàn thiện và có sự kế thừa chọn lọc các giá trị dân chủ trước đó.',
        points: 1,
      },
    ],
  },
  {
    id: 9,
    name: 'SẢN XUẤT VÀ LAO ĐỘNG',
    category: 'economy',
    subtitle: 'Lao động và quyền làm chủ tư liệu sản xuất',
    questions: [
      {
        id: 'q_9_1',
        text: 'Trong sản xuất, người lao động thực hiện quyền làm chủ thông qua những hoạt động nào?',
        answer: 'Tham gia sản xuất, kinh doanh và quản lý.',
        points: 1,
      },
      {
        id: 'q_9_2',
        text: 'Theo bản chất kinh tế của dân chủ XHCN, nhân dân làm chủ những tư liệu nào?',
        answer: 'Những tư liệu sản xuất chủ yếu.',
        points: 1,
      },
      {
        id: 'q_9_3',
        text: 'Lợi ích kinh tế của lực lượng nào được coi là một động lực cơ bản?',
        answer: 'Người lao động.',
        points: 1,
      },
      {
        id: 'q_9_4',
        text: 'Bản chất kinh tế của dân chủ XHCN dựa trên sự phát triển của lực lượng sản xuất ở trình độ nào?',
        answer: 'Trình độ cao/hiện đại, nhằm đáp ứng ngày càng cao nhu cầu vật chất và tinh thần của nhân dân.',
        points: 1,
      },
    ],
  },
  {
    id: 10,
    name: 'TÌNH HUỐNG 2',
    category: 'scenario',
    subtitle: 'Vận dụng thực tiễn kinh tế - văn hóa',
    questions: [
      {
        id: 'q_10_1',
        text: 'Một doanh nghiệp cho người lao động tham gia góp ý cách tổ chức sản xuất và quản lý. Tình huống này thể hiện phương diện nào?',
        answer: 'Bản chất kinh tế của nền dân chủ XHCN.',
        points: 2,
      },
      {
        id: 'q_10_2',
        text: 'Một chương trình phát triển chỉ tăng sản lượng nhưng không quan tâm nhu cầu vật chất, tinh thần của người lao động. Theo bài học còn thiếu định hướng nào?',
        answer: 'Phát triển kinh tế phải hướng tới thỏa mãn ngày càng cao nhu cầu vật chất và tinh thần của nhân dân lao động.',
        points: 2,
      },
      {
        id: 'q_10_3',
        text: 'Người dân được mời góp ý dự thảo chính sách của địa phương. Đây là biểu hiện của quyền làm chủ nào?',
        answer: 'Quyền làm chủ chính trị, tham gia quản lý nhà nước và xây dựng chính sách.',
        points: 2,
      },
      {
        id: 'q_10_4',
        text: 'Một hoạt động văn hóa loại bỏ hoàn toàn truyền thống để chạy theo cái mới. Có phù hợp với bản chất văn hóa của dân chủ XHCN không?',
        answer: 'Không; cần kế thừa, phát huy tinh hoa văn hóa dân tộc đồng thời tiếp thu giá trị tiến bộ của nhân loại.',
        points: 2,
      },
    ],
  },
  {
    id: 11,
    name: 'GIÁO DỤC',
    category: 'culture_society',
    subtitle: 'Nâng cao dân trí và làm chủ tinh thần',
    questions: [
      {
        id: 'q_11_1',
        text: 'Theo bản chất tư tưởng – văn hóa – xã hội, nâng cao trình độ văn hóa của nhân dân nhằm tạo điều kiện cho điều gì?',
        answer: 'Cho nhân dân làm chủ đời sống tinh thần và có điều kiện phát triển cá nhân.',
        points: 1,
      },
      {
        id: 'q_11_2',
        text: 'Việc tạo cơ hội học tập và nâng cao trình độ của người dân gắn với phương diện bản chất nào?',
        answer: 'Tư tưởng – văn hóa – xã hội.',
        points: 1,
      },
      {
        id: 'q_11_3',
        text: 'Nhân dân không chỉ là người hưởng thụ mà còn có vai trò gì đối với các giá trị văn hóa, tinh thần?',
        answer: 'Làm chủ và tham gia sáng tạo các giá trị văn hóa, tinh thần.',
        points: 1,
      },
      {
        id: 'q_11_4',
        text: 'Việc nâng cao trình độ của nhân dân góp phần tạo điều kiện nào để dân chủ được thực hiện thực chất?',
        answer: 'Nâng cao dân trí/trình độ để nhân dân có khả năng thực hiện quyền làm chủ.',
        points: 1,
      },
    ],
  },
  {
    id: 12,
    name: 'PHÁP LUẬT VÀ BẢO ĐẢM QUYỀN DÂN CHỦ',
    category: 'law',
    subtitle: 'Bảo đảm quyền tự do và làm chủ',
    questions: [
      {
        id: 'q_12_1',
        text: 'Pháp luật có vai trò gì đối với việc thực hiện dân chủ?',
        answer: 'Thể chế hóa và bảo đảm việc thực hiện các quyền dân chủ.',
        points: 1,
      },
      {
        id: 'q_12_2',
        text: 'Theo giáo trình, để quyền lực thực sự thuộc về nhân dân cần có cơ chế pháp luật bảo đảm những quyền gì?',
        answer: 'Quyền tự do cá nhân, quyền làm chủ nhà nước và quyền tham gia vào các quyết sách của nhà nước.',
        points: 1,
      },
      {
        id: 'q_12_3',
        text: 'Đúng hay sai: Chỉ cần tuyên bố quyền dân chủ là đủ, không cần cơ chế bảo đảm thực hiện.',
        answer: 'Sai. Cần các điều kiện và cơ chế pháp luật để quyền dân chủ được thực hiện thực chất.',
        points: 1,
      },
      {
        id: 'q_12_4',
        text: 'Vì sao pháp luật không đối lập với dân chủ trong nội dung bài học?',
        answer: 'Vì dân chủ và pháp luật nằm trong sự thống nhất biện chứng; pháp luật thể chế hóa và bảo đảm dân chủ.',
        points: 1,
      },
    ],
  },
  {
    id: 13,
    name: 'QUẢN LÝ NHÀ NƯỚC',
    category: 'politics',
    subtitle: 'Nhân dân tham gia xây dựng bộ máy nhà nước',
    questions: [
      {
        id: 'q_13_1',
        text: 'Nhân dân tham gia quản lý nhà nước thể hiện bản chất nào của nền dân chủ XHCN?',
        answer: 'Bản chất chính trị.',
        points: 1,
      },
      {
        id: 'q_13_2',
        text: 'Theo giáo trình, ngoài việc giới thiệu đại biểu, nhân dân có thể tham gia vào quá trình nào của nhà nước?',
        answer: 'Xây dựng chính sách, pháp luật và tham gia xây dựng bộ máy nhà nước.',
        points: 1,
      },
      {
        id: 'q_13_3',
        text: 'Sự tham gia rộng rãi của nhân dân vào quản lý nhà nước nhằm bảo đảm nguyên tắc nào?',
        answer: 'Mọi quyền lực thuộc về nhân dân; dân là chủ và dân làm chủ.',
        points: 1,
      },
      {
        id: 'q_13_4',
        text: 'Trong nền dân chủ XHCN, quyền làm chủ của nhân dân được thực hiện trên phạm vi nào?',
        answer: 'Trên các lĩnh vực của đời sống xã hội, trong đó có quản lý nhà nước và xã hội.',
        points: 1,
      },
    ],
  },
  {
    id: 14,
    name: 'PHÂN PHỐI VÀ PHÚC LỢI',
    category: 'economy',
    subtitle: 'Phân phối theo lao động và phúc lợi xã hội',
    questions: [
      {
        id: 'q_14_1',
        text: 'Theo giáo trình, phân phối lợi ích trong nền dân chủ XHCN chủ yếu dựa theo yếu tố nào?',
        answer: 'Kết quả lao động.',
        points: 1,
      },
      {
        id: 'q_14_2',
        text: 'Phân phối có liên quan trực tiếp đến quyền làm chủ trên phương diện nào?',
        answer: 'Kinh tế.',
        points: 1,
      },
      {
        id: 'q_14_3',
        text: 'Việc bảo đảm lợi ích kinh tế của người lao động có ý nghĩa gì?',
        answer: 'Là một động lực cơ bản thúc đẩy phát triển kinh tế – xã hội.',
        points: 1,
      },
      {
        id: 'q_14_4',
        text: 'Mục tiêu cuối cùng của cơ sở kinh tế XHCN được giáo trình nêu là đáp ứng ngày càng cao những nhu cầu nào?',
        answer: 'Nhu cầu vật chất và tinh thần của toàn thể nhân dân lao động.',
        points: 1,
      },
    ],
  },
  {
    id: 15,
    name: 'VĂN HÓA VÀ ĐỜI SỐNG TINH THẦN',
    category: 'culture_society',
    subtitle: 'Kế thừa tinh hoa và hệ tư tưởng Mác - Lênin',
    questions: [
      {
        id: 'q_15_1',
        text: 'Nền dân chủ XHCN kế thừa và phát huy những giá trị văn hóa nào?',
        answer: 'Tinh hoa văn hóa truyền thống dân tộc.',
        points: 1,
      },
      {
        id: 'q_15_2',
        text: 'Bên cạnh truyền thống dân tộc, nền dân chủ XHCN tiếp thu những gì từ nhân loại?',
        answer: 'Các giá trị tư tưởng, văn hóa, văn minh và tiến bộ xã hội.',
        points: 1,
      },
      {
        id: 'q_15_3',
        text: 'Nhân dân thực hiện quyền làm chủ trong đời sống văn hóa – tinh thần như thế nào?',
        answer: 'Làm chủ, hưởng thụ và tham gia sáng tạo các giá trị văn hóa, tinh thần.',
        points: 1,
      },
      {
        id: 'q_15_4',
        text: 'Bản chất tư tưởng – văn hóa của nền dân chủ XHCN lấy hệ tư tưởng nào làm chủ đạo?',
        answer: 'Chủ nghĩa Mác – Lênin.',
        points: 1,
      },
    ],
  },
  {
    id: 16,
    name: 'KIẾN THỨC: NỀN DÂN CHỦ XHCN',
    category: 'knowledge',
    subtitle: 'Đặc trưng và địa vị của nhân dân',
    questions: [
      {
        id: 'q_16_1',
        text: 'Hoàn thành ý: Trong nền dân chủ XHCN, mọi quyền lực thuộc về ______.',
        answer: 'Nhân dân.',
        points: 1,
      },
      {
        id: 'q_16_2',
        text: 'Hai vế thể hiện địa vị và hoạt động của nhân dân trong nền dân chủ XHCN là gì?',
        answer: 'Dân là chủ và dân làm chủ.',
        points: 1,
      },
      {
        id: 'q_16_3',
        text: 'Nền dân chủ XHCN được giáo trình đánh giá như thế nào so với nền dân chủ tư sản?',
        answer: 'Là nền dân chủ cao hơn về chất.',
        points: 1,
      },
      {
        id: 'q_16_4',
        text: 'Nền dân chủ XHCN được thực hiện bằng nhà nước nào và đặt dưới sự lãnh đạo của lực lượng nào?',
        answer: 'Nhà nước pháp quyền XHCN, đặt dưới sự lãnh đạo của Đảng Cộng sản.',
        points: 1,
      },
    ],
  },
  {
    id: 17,
    name: 'Y TẾ VÀ AN SINH XÃ HỘI',
    category: 'culture_society',
    subtitle: 'Hài hòa lợi ích và phát triển toàn diện',
    questions: [
      {
        id: 'q_17_1',
        text: 'Việc bảo đảm điều kiện sống để con người phát triển gắn với phương diện nào của bản chất dân chủ XHCN?',
        answer: 'Tư tưởng – văn hóa – xã hội.',
        points: 1,
      },
      {
        id: 'q_17_2',
        text: 'Theo tinh thần của giáo trình, mục tiêu của nền dân chủ XHCN có chỉ dừng ở quyền chính trị hay còn hướng đến đời sống của nhân dân?',
        answer: 'Không chỉ quyền chính trị; còn hướng tới đáp ứng nhu cầu vật chất, tinh thần và phát triển con người.',
        points: 1,
      },
      {
        id: 'q_17_3',
        text: 'Khi xây dựng chính sách xã hội, ba nhóm lợi ích nào cần được kết hợp hài hòa?',
        answer: 'Lợi ích cá nhân, tập thể và toàn xã hội.',
        points: 1,
      },
      {
        id: 'q_17_4',
        text: 'Việc tạo điều kiện để mọi người phát triển cá nhân phản ánh nội dung nào của bản chất xã hội?',
        answer: 'Nhân dân làm chủ đời sống xã hội và có điều kiện phát triển toàn diện/cá nhân.',
        points: 1,
      },
    ],
  },
  {
    id: 18,
    name: 'TÌNH HUỐNG 3',
    category: 'scenario',
    subtitle: 'Thực chất quyền làm chủ và giáo dục',
    questions: [
      {
        id: 'q_18_1',
        text: 'Một địa phương tổ chức lấy ý kiến dân nhưng ý kiến hợp pháp của người dân không có cơ chế tiếp nhận, phản hồi. Theo bài học còn thiếu điều kiện gì?',
        answer: 'Cơ chế pháp luật và cơ chế thực hiện để quyền làm chủ được bảo đảm thực chất.',
        points: 2,
      },
      {
        id: 'q_18_2',
        text: 'Một doanh nghiệp phân phối lợi ích chủ yếu dựa trên kết quả lao động. Điều này phù hợp với phương diện nào?',
        answer: 'Bản chất kinh tế.',
        points: 2,
      },
      {
        id: 'q_18_3',
        text: 'Một chương trình giáo dục giúp người dân nâng cao trình độ và khả năng tham gia công việc xã hội. Điều này hỗ trợ việc thực hiện dân chủ ra sao?',
        answer: 'Tạo điều kiện để nhân dân có năng lực thực hiện quyền làm chủ và phát triển cá nhân.',
        points: 2,
      },
      {
        id: 'q_18_4',
        text: 'Một cộng đồng chỉ bảo vệ lợi ích chung bằng cách phủ nhận hoàn toàn lợi ích cá nhân. Có phù hợp không?',
        answer: 'Không; cần kết hợp hài hòa lợi ích cá nhân, tập thể và toàn xã hội.',
        points: 2,
      },
    ],
  },
  {
    id: 19,
    name: 'MÔI TRƯỜNG VÀ CỘNG ĐỒNG',
    category: 'culture_society',
    subtitle: 'Tính tích cực xã hội và tiềm năng sáng tạo',
    questions: [
      {
        id: 'q_19_1',
        text: 'Khi giải quyết một vấn đề môi trường ảnh hưởng cả cộng đồng, cần kết hợp hài hòa những lợi ích nào theo giáo trình?',
        answer: 'Lợi ích cá nhân, tập thể và toàn xã hội.',
        points: 1,
      },
      {
        id: 'q_19_2',
        text: 'Việc người dân chủ động tham gia giải quyết công việc chung của cộng đồng thể hiện điều gì?',
        answer: 'Tính tích cực xã hội và quyền làm chủ của nhân dân.',
        points: 1,
      },
      {
        id: 'q_19_3',
        text: 'Bản chất xã hội của nền dân chủ XHCN hướng tới phát huy tiềm năng nào của nhân dân?',
        answer: 'Tiềm năng sáng tạo và tính tích cực xã hội.',
        points: 1,
      },
      {
        id: 'q_19_4',
        text: 'Một quyết định cộng đồng chỉ hợp lý khi bảo đảm lợi ích của một cá nhân hay cần xem xét rộng hơn?',
        answer: 'Cần hài hòa lợi ích cá nhân, tập thể và toàn xã hội.',
        points: 1,
      },
    ],
  },
  {
    id: 20,
    name: 'QUYỀN VÀ NGHĨA VỤ CÔNG DÂN',
    category: 'politics',
    subtitle: 'Quyền con người gắn liền nghĩa vụ',
    questions: [
      {
        id: 'q_20_1',
        text: 'Dân chủ trong kinh tế và chính trị trực tiếp thể hiện những nhóm quyền nào của người dân?',
        answer: 'Quyền con người và quyền công dân.',
        points: 1,
      },
      {
        id: 'q_20_2',
        text: 'Quyền làm chủ của công dân có tách rời kỷ luật và kỷ cương không?',
        answer: 'Không.',
        points: 1,
      },
      {
        id: 'q_20_3',
        text: '“Dân là chủ” nhấn mạnh điều gì về vị trí của nhân dân?',
        answer: 'Nhân dân là chủ thể, có địa vị làm chủ xã hội.',
        points: 1,
      },
      {
        id: 'q_20_4',
        text: '“Dân làm chủ” nhấn mạnh điều gì?',
        answer: 'Nhân dân thực tế thực hiện và sử dụng quyền làm chủ của mình.',
        points: 1,
      },
    ],
  },
  {
    id: 21,
    name: 'XÂY DỰNG CHÍNH SÁCH VÀ PHÁP LUẬT',
    category: 'law',
    subtitle: 'Góp ý chính sách và hoàn thiện pháp luật',
    questions: [
      {
        id: 'q_21_1',
        text: 'Việc nhân dân góp ý dự thảo chính sách, pháp luật thể hiện quyền gì?',
        answer: 'Quyền tham gia quản lý nhà nước và thực hiện quyền làm chủ chính trị.',
        points: 1,
      },
      {
        id: 'q_21_2',
        text: 'Vì sao chính sách và pháp luật là một kênh quan trọng để thực hiện dân chủ?',
        answer: 'Vì dân chủ cần được thể chế hóa bằng pháp luật và pháp luật bảo đảm.',
        points: 1,
      },
      {
        id: 'q_21_3',
        text: 'Theo giáo trình, nhân dân có thể tham gia vào việc xây dựng những gì ngoài chính sách và pháp luật?',
        answer: 'Bộ máy nhà nước và đội ngũ cán bộ/đại biểu của mình.',
        points: 1,
      },
      {
        id: 'q_21_4',
        text: 'Một chính sách dân chủ muốn được thực hiện ổn định cần gắn với những yêu cầu nào?',
        answer: 'Pháp luật, kỷ luật và kỷ cương.',
        points: 1,
      },
    ],
  },
  {
    id: 22,
    name: 'DOANH NGHIỆP VÀ LỢI ÍCH NGƯỜI LAO ĐỘNG',
    category: 'economy',
    subtitle: 'Làm chủ tại cơ sở sản xuất kinh doanh',
    questions: [
      {
        id: 'q_22_1',
        text: 'Trong doanh nghiệp, quyền làm chủ kinh tế của người lao động có thể thể hiện qua những hoạt động nào?',
        answer: 'Tham gia sản xuất, kinh doanh, quản lý và phân phối.',
        points: 1,
      },
      {
        id: 'q_22_2',
        text: 'Lợi ích kinh tế của ai là một động lực cơ bản theo bản chất kinh tế của dân chủ XHCN?',
        answer: 'Người lao động.',
        points: 1,
      },
      {
        id: 'q_22_3',
        text: 'Phân phối lợi ích chủ yếu theo kết quả gì?',
        answer: 'Kết quả lao động.',
        points: 1,
      },
      {
        id: 'q_22_4',
        text: 'Nếu người lao động hoàn toàn không được tham gia quản lý và lợi ích không gắn với lao động, phương diện nào của quyền làm chủ bị hạn chế?',
        answer: 'Quyền làm chủ về kinh tế.',
        points: 1,
      },
    ],
  },
  {
    id: 23,
    name: 'TÌNH HUỐNG 4',
    category: 'scenario',
    subtitle: 'Vận dụng tổng hợp các phương diện bản chất',
    questions: [
      {
        id: 'q_23_1',
        text: 'Người dân được bầu đại diện, góp ý chính sách và tham gia quản lý công việc địa phương. Ba hoạt động này cùng thể hiện rõ nhất bản chất nào?',
        answer: 'Bản chất chính trị.',
        points: 2,
      },
      {
        id: 'q_23_2',
        text: 'Người lao động được tham gia quản lý sản xuất, lợi ích gắn với kết quả lao động. Đây là biểu hiện tổng hợp của bản chất nào?',
        answer: 'Bản chất kinh tế.',
        points: 2,
      },
      {
        id: 'q_23_3',
        text: 'Một xã hội vừa phát huy văn hóa dân tộc, vừa tiếp thu giá trị tiến bộ của nhân loại và tạo điều kiện phát triển cá nhân. Đây là phương diện nào?',
        answer: 'Bản chất tư tưởng – văn hóa – xã hội.',
        points: 2,
      },
      {
        id: 'q_23_4',
        text: 'Một người có quyền góp ý chính sách nhưng phải thực hiện quyền đó trong khuôn khổ pháp luật. Tình huống thể hiện mối quan hệ nào?',
        answer: 'Sự thống nhất biện chứng giữa dân chủ và pháp luật.',
        points: 2,
      },
    ],
  },
  {
    id: 24,
    name: 'PHÁT TRIỂN CON NGƯỜI',
    category: 'culture_society',
    subtitle: 'Giải phóng và phát triển toàn diện con người',
    questions: [
      {
        id: 'q_24_1',
        text: 'Nền dân chủ XHCN tạo điều kiện cho cá nhân phát triển thông qua việc nâng cao những gì?',
        answer: 'Trình độ văn hóa, đời sống vật chất và tinh thần, cùng điều kiện tham gia xã hội.',
        points: 1,
      },
      {
        id: 'q_24_2',
        text: 'Việc phát huy tiềm năng sáng tạo của con người thuộc phương diện bản chất nào?',
        answer: 'Tư tưởng – văn hóa – xã hội.',
        points: 1,
      },
      {
        id: 'q_24_3',
        text: 'Theo giáo trình, nhân dân phải được làm chủ không chỉ nhà nước và xã hội mà còn làm chủ điều gì ở chính mình?',
        answer: 'Chính bản thân mình và năng lực sáng tạo của mình.',
        points: 1,
      },
      {
        id: 'q_24_4',
        text: 'Mục tiêu mở rộng dân chủ cuối cùng gắn với việc giải phóng và phát triển chủ thể nào?',
        answer: 'Con người/nhân dân, tạo điều kiện để con người phát triển và thực hiện quyền làm chủ.',
        points: 1,
      },
    ],
  },
];

export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    bgClass: string;
    badgeClass: string;
    borderClass: string;
    accentColor: string;
    textColor: string;
    description: string;
  }
> = {
  start: {
    label: 'BẮT ĐẦU',
    bgClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-amber-200',
    badgeClass: 'bg-amber-400 text-slate-950 font-black',
    borderClass: 'border-amber-400',
    accentColor: '#1E293B',
    textColor: 'text-amber-200',
    description: 'Xuất phát điểm hành trình làm chủ của nhân dân',
  },
  politics: {
    label: 'CHÍNH TRỊ',
    bgClass: 'bg-rose-50/95 hover:bg-rose-100/90 border-rose-400',
    badgeClass: 'bg-rose-700 text-white font-bold',
    borderClass: 'border-rose-400',
    accentColor: '#BE123C',
    textColor: 'text-rose-950',
    description: 'Quyền làm chủ, bầu cử, quản lý nhà nước & xã hội',
  },
  economy: {
    label: 'KINH TẾ',
    bgClass: 'bg-amber-50/95 hover:bg-amber-100/90 border-amber-400',
    badgeClass: 'bg-amber-600 text-white font-bold',
    borderClass: 'border-amber-400',
    accentColor: '#D97706',
    textColor: 'text-amber-950',
    description: 'Sản xuất, lao động, phân phối & phúc lợi',
  },
  culture_society: {
    label: 'VĂN HÓA - XÃ HỘI',
    bgClass: 'bg-sky-50/95 hover:bg-sky-100/90 border-sky-400',
    badgeClass: 'bg-sky-700 text-white font-bold',
    borderClass: 'border-sky-400',
    accentColor: '#0369A1',
    textColor: 'text-sky-950',
    description: 'Giáo dục, văn hóa, an sinh & phát triển con người',
  },
  law: {
    label: 'PHÁP LUẬT',
    bgClass: 'bg-emerald-50/95 hover:bg-emerald-100/90 border-emerald-400',
    badgeClass: 'bg-emerald-700 text-white font-bold',
    borderClass: 'border-emerald-400',
    accentColor: '#047857',
    textColor: 'text-emerald-950',
    description: 'Dân chủ gắn với pháp luật, kỷ luật và kỷ cương',
  },
  knowledge: {
    label: 'KIẾN THỨC',
    bgClass: 'bg-orange-50/95 hover:bg-orange-100/90 border-orange-300',
    badgeClass: 'bg-orange-600 text-white font-bold',
    borderClass: 'border-orange-300',
    accentColor: '#C2410C',
    textColor: 'text-orange-950',
    description: 'Khái niệm và lịch sử phát triển nền dân chủ',
  },
  scenario: {
    label: 'TÌNH HUỐNG (+2đ)',
    bgClass: 'bg-purple-50/95 hover:bg-purple-100/90 border-purple-400',
    badgeClass: 'bg-purple-700 text-white font-bold',
    borderClass: 'border-purple-400',
    accentColor: '#7E22CE',
    textColor: 'text-purple-950',
    description: 'Vận dụng tổng hợp các tình huống thực tiễn',
  },
};

export const TIE_BREAK_QUESTIONS = [
  {
    text: 'Bản chất dân chủ XHCN được thể hiện qua ba phương diện cơ bản nào?',
    answer: '1. Bản chất chính trị; 2. Bản chất kinh tế; 3. Bản chất tư tưởng – văn hóa – xã hội.',
  },
  {
    text: 'Theo định nghĩa của Lênin, dân chủ với tư cách một hình thái nhà nước sẽ mất đi khi nào?',
    answer: 'Khi nhà nước tiêu vong (xã hội cộng sản chủ nghĩa phát triển hoàn toàn).',
  },
  {
    text: 'Phương châm thực hiện dân chủ ở cơ sở của Việt Nam gồm những mệnh đề nào?',
    answer: 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng.',
  },
  {
    text: 'Mối quan hệ bản chất giữa quyền làm chủ và trách nhiệm công dân trong nền dân chủ XHCN là gì?',
    answer: 'Quyền lợi đi đôi với nghĩa vụ, dân chủ gắn liền với pháp luật, kỷ luật và kỷ cương.',
  },
];
