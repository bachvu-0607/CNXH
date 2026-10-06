# Hành Trình Làm Chủ

Trò chơi dành cho một quản trò quan sát và tối đa **7 người chơi/đội**. Người chơi đi hết một vòng 24 ô để thắng. Lượt chính có 60 giây trả lời, cửa sổ cướp quyền 12 giây và người cướp có 30 giây trả lời. Mỗi người có 2 gợi ý mỗi ván.

Dùng Node.js 22.12+ hoặc 24 và npm để cài từ lockfile:

```sh
npm ci
npm run dev
```

Người chơi vào bằng mã khách lưu trên trình duyệt; Firebase Authentication không cần bật. Người có mã phòng có thể đọc và tham gia phòng, vì vậy chỉ chia sẻ liên kết với nhóm chơi.

Kiểm tra:

```sh
npm test
npm run lint
npm run build
npm run test:rules
```

`test:rules` cần Java 21+ và tự khởi động Firestore emulator cho project `demo-cnxh`. Kiểm thử bao gồm 7 người chơi, giao dịch đồng thời, hết giờ, cướp quyền, rời phòng, thắng cuộc, thao tác gửi lặp và quyền truy cập. Các tests không chạm dữ liệu Firebase thật.

Triển khai frontend theo cấu hình Vercel hiện có. Firestore rules được triển khai riêng vào đúng named database trong `firebase.json`:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project gen-lang-client-0040421659
```

Push Git không tự triển khai Firestore rules. Cần cập nhật cả frontend và rules, rồi tạo phòng mới để bắt đầu ván với phiên bản này; các tab còn mở bản cũ cần tải lại. Không xóa dữ liệu phòng hiện có trong quá trình triển khai.

Quản trò có thể mở câu hỏi thay người chơi và dùng nút **Bỏ qua lượt** nếu người chơi đóng tab trước khi tung xúc xắc. Khi đang trả lời, bất kỳ thành viên còn kết nối nào cũng tự xử lý hết giờ. Nếu tất cả đóng tab, việc xử lý tiếp tục khi một thành viên quay lại.

Bộ chấm chấp nhận các đáp án được khai báo trong bộ câu hỏi, viết không dấu, các viết tắt thông dụng và hoán vị đủ các ý của một danh sách. Nếu câu trả lời không khớp tự động, quản trò có 15 giây để xem và xác nhận đúng/sai; khi quản trò từ chối câu trả lời của người chơi chính, cửa sổ cướp quyền mới mở. Nếu không có xác nhận trong 15 giây, đáp án được tính là sai.
