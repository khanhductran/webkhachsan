// script.js - Thanh Muong Hotel (FULL - Bổ sung thanh toán thông minh)

let danhSach = JSON.parse(localStorage.getItem("ks")) || [];

/* ================= CLOCK ================= */
setInterval(() => {
    document.getElementById("clock").innerText =
        new Date().toLocaleString("vi-VN");
}, 1000);

/* ================= DỊCH VỤ ================= */
let dichVuList = [
    { ten: "Giặt ủi", gia: 50000 },
    { ten: "Ăn uống", gia: 150000 },
    { ten: "Spa", gia: 300000 }
];

/* ================= TẠO DANH SÁCH PHÒNG ================= */
let dsPhong = [];
for (let t = 1; t <= 8; t++) {
    for (let p = 1; p <= 5; p++) {
        dsPhong.push(`${t}${String(p).padStart(2, "0")}`);
    }
}

/* ================= LOẠI PHÒNG ================= */
function loaiPhong(ma) {
    let tang = parseInt(ma[0]);
    let so = ma.slice(1);
    if (so === "03" || so === "04") return "Gia đình";
    if ((so === "02" || so === "05") && tang >= 6) return "VIP";
    return "Thường";
}

/* ================= GIÁ ================= */
function giaPhong(loai) {
    if (loai === "VIP") return 1000000;
    if (loai === "Gia đình") return 800000;
    return 200000;
}

/* ================= ROOM CARD ================= */
function hienThiRoomCards() {
    let types = ["Thường", "VIP", "Gia đình"];
    let html = "";
    types.forEach(loai => {
        html += `
        <div class="card">
            <img src="images/room.jpg">
            <div class="info">
                <h2>Phòng ${loai}</h2>
                <p>Không gian sạch sẽ, tiện nghi, hiện đại.</p>
            </div>
            <div class="price">
                <h3>${giaPhong(loai).toLocaleString()} ₫</h3>
                <button onclick="moDatPhong('${loai}')">Đặt phòng</button>
            </div>
        </div>`;
    });
    document.getElementById("room-list").innerHTML = html;
}

/* ================= TÌM PHÒNG TRỐNG ================= */
function phongTrongTheoLoai(loai) {
    return dsPhong.filter(p => {
        if (loaiPhong(p) !== loai) return false;
        let dangThue = danhSach.some(k => k.phong === p);
        return !dangThue;
    });
}

/* ================= MỞ POPUP ĐẶT PHÒNG ================= */
function moDatPhong(loai) {
    let ds = phongTrongTheoLoai(loai);
    if (ds.length === 0) {
        alert("Hết phòng loại này!");
        return;
    }
    let optionPhong = ds.map(p => `<option>${p}</option>`).join("");
    let dv = "";
    dichVuList.forEach((d, i) => {
        dv += `
        <div class="dv-item">
            <span>${d.ten} (+${d.gia.toLocaleString()} ₫)</span>
            <input type="checkbox" value="${i}">
        </div>`;
    });

    let html = `
    <span class="close-btn" onclick="dongPopup()">✖</span>
    <h3>Đặt phòng ${loai}</h3>
    <input id="tenKhach" placeholder="Tên khách">
    <select id="phong">${optionPhong}</select>
    <label>Check-in</label><input type="datetime-local" id="checkin">
    <label>Check-out</label><input type="datetime-local" id="checkout">
    <h4>Dịch vụ</h4> ${dv}
    <button onclick="xacNhanDatPhong('${loai}')">Xác nhận</button>`;

    let popup = document.getElementById("popup");
    popup.innerHTML = html;
    popup.style.display = "block";
}

function dongPopup() {
    document.getElementById("popup").style.display = "none";
}

/* ================= XÁC NHẬN ĐẶT ================= */
function xacNhanDatPhong(loai) {
    let ten = document.getElementById("tenKhach").value.trim();
    let phong = document.getElementById("phong").value;
    let ci = document.getElementById("checkin").value;
    let co = document.getElementById("checkout").value;
    if (!ten || !ci || !co) { alert("Nhập thiếu thông tin!"); return; }
    if (new Date(co) <= new Date(ci)) { alert("Check-out phải sau Check-in!"); return; }

    let soNgay = Math.ceil((new Date(co) - new Date(ci)) / (1000 * 60 * 60 * 24));
    let dsDV = []; let tienDV = 0;
    document.querySelectorAll(".popup input[type='checkbox']:checked").forEach(cb => {
        let item = dichVuList[cb.value];
        dsDV.push(item.ten); tienDV += item.gia;
    });

    let tongTien = giaPhong(loai) * soNgay + tienDV;
    danhSach.push({ ten, phong, loai, checkin: ci, checkout: co, dichvu: dsDV, tien: tongTien });
    localStorage.setItem("ks", JSON.stringify(danhSach));
    dongPopup();
    renderAll();
}

/* ================= TÍNH NĂNG THANH TOÁN THÔNG MINH (MỚI) ================= */
function checkOut(i) {
    let k = danhSach[i];
    let html = `
    <span class="close-btn" onclick="dongPopup()">✖</span>
    <h3>Hóa đơn thanh toán</h3>
    <div style="text-align: left; margin-bottom: 15px;">
        <p><b>Khách hàng:</b> ${k.ten}</p>
        <p><b>Phòng:</b> ${k.phong} (${k.loai})</p>
        <p><b>Tổng tiền:</b> <span style="color:red; font-weight:bold">${k.tien.toLocaleString()} ₫</span></p>
    </div>
    
    <div id="payment-options">
        <p><b>Chọn phương thức:</b></p>
        <button onclick="xacNhanOut(${i})" style="background:#28a745; margin-bottom:10px;">💵 Tiền mặt</button>
        <button onclick="hienQR(${i})" style="background:#0071c2;">📲 Chuyển khoản QR</button>
    </div>

    <div id="qr-area" style="display:none; margin-top:15px; border-top: 1px dashed #ccc; padding-top: 15px;">
        <p>Quét mã để chuyển khoản:</p>
        <img id="qr-img" src="" style="width:200px; height:200px; border:1px solid #ddd; padding:5px;">
        <p style="font-size:12px; color:gray;">(Vui lòng xác nhận sau khi chuyển khoản)</p>
        <button onclick="xacNhanOut(${i})" style="background:#28a745;">Xác nhận đã nhận tiền</button>
    </div>
    `;

    let popup = document.getElementById("popup");
    popup.innerHTML = html;
    popup.style.display = "block";
}

function hienQR(i) {
    let k = danhSach[i];
    // Thay MB, STK, và Tên bằng thông tin của bạn
    const nganHang = "MB"; 
    const stk = "0123456789"; 
    const chuTk = "TRAN KHANH DUC"; 
    
    const qrUrl = `https://img.vietqr.io/image/${nganHang}-${stk}-compact2.png?amount=${k.tien}&addInfo=ThanhToan Phong ${k.phong}&accountName=${chuTk}`;
    
    document.getElementById("qr-img").src = qrUrl;
    document.getElementById("qr-area").style.display = "block";
    document.getElementById("payment-options").style.display = "none";
}

function xacNhanOut(i) {
    if(confirm("Xác nhận hoàn tất thanh toán và trả phòng?")) {
        danhSach.splice(i, 1);
        localStorage.setItem("ks", JSON.stringify(danhSach));
        dongPopup();
        renderAll();
    }
}

/* ================= HỦY ================= */
function huyPhong(i) {
    if (!confirm("Xác nhận hủy đặt phòng?")) return;
    danhSach.splice(i, 1);
    localStorage.setItem("ks", JSON.stringify(danhSach));
    renderAll();
}

/* ================= ROOM MAP ================= */
function vePhong() {
    let html = "";
    for (let t = 8; t >= 1; t--) {
        html += `<div class="floor"><b>Tầng ${t}</b><br>`;
        for (let p = 1; p <= 5; p++) {
            let ma = `${t}${String(p).padStart(2, "0")}`;
            let loai = loaiPhong(ma);
            let border = loai === "VIP" ? "vip" : (loai === "Gia đình" ? "family" : "thuong");
            let khach = danhSach.find(x => x.phong === ma);
            let status = "trong";
            if (khach) {
                let con24h = new Date(khach.checkout) - new Date() <= 86400000;
                status = con24h ? "saptra" : "day";
            }
            html += `<span class="room ${status} ${border}" onclick="xemPhong('${ma}')">${ma}</span>`;
        }
        html += `</div>`;
    }
    document.getElementById("rooms").innerHTML = html;
}

/* ================= CLICK ROOM ================= */
function xemPhong(ma) {
    let k = danhSach.find(x => x.phong === ma);
    if (!k) { alert("Phòng " + ma + " đang trống"); return; }
    alert(`Phòng ${ma}\nKhách: ${k.ten}\nLoại: ${k.loai}\nCheck-in: ${new Date(k.checkin).toLocaleString("vi-VN")}\nCheck-out: ${new Date(k.checkout).toLocaleString("vi-VN")}\nTiền: ${k.tien.toLocaleString()} ₫`);
}

/* ================= TABLE ================= */
function renderTable() {
    let html = "";
    danhSach.forEach((k, i) => {
        html += `
        <tr>
            <td>${k.ten}</td>
            <td>${k.phong}</td>
            <td>${k.loai}</td>
            <td>${new Date(k.checkin).toLocaleString("vi-VN")}</td>
            <td>${new Date(k.checkout).toLocaleString("vi-VN")}</td>
            <td>${k.dichvu.join(", ") || "Không"}</td>
            <td>${k.tien.toLocaleString()} ₫</td>
            <td>
                <button onclick="checkOut(${i})">Out</button>
                <button onclick="huyPhong(${i})">Hủy</button>
            </td>
        </tr>`;
    });
    document.getElementById("danhsach").innerHTML = html;
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
    let tong = dsPhong.length;
    let dang = danhSach.length;
    let trong = tong - dang;
    let doanhthu = 0;
    danhSach.forEach(k => doanhthu += k.tien);
    document.getElementById("tongPhong").innerText = tong;
    document.getElementById("dangThue").innerText = dang;
    document.getElementById("phongTrong").innerText = trong;
    document.getElementById("doanhthu").innerText = doanhthu.toLocaleString() + " ₫";
}

/* ================= SEARCH ================= */
function timKiem() {
    let key = document.getElementById("timkiem").value.toLowerCase();
    document.querySelectorAll("#danhsach tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(key) ? "" : "none";
    });
}

/* ================= MAIN RENDER ================= */
function renderAll() {
    renderDashboard();
    renderTable();
    vePhong();
}

/* ================= AUTO ================= */
setInterval(() => { vePhong(); }, 60000);

/* ================= START ================= */
hienThiRoomCards();
renderAll();