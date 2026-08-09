const { getConnectionDB, getConnectionBackupDB } = require("../../config/db/connection");
const VisitsModel = require('../../models/visits/visits.model');
const { generateReceiptPdf } = require('../../utils/generateReceiptPdf');
const { uploadReceipt } = require('../../utils/uploadToStorage');
const { sendReceiptEmail } = require('../../utils/sendEmail');


exports.createVisit = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    await conn.beginTransaction();

    try {

        validateCreateVisit(req.body);

        const externalVisitorId = await getOrCreateExternalVisitor(conn, req.body);

        const payment = calculatePaymentStatus(req.body);

        //const folio = await generateVisitFolio(conn, req.body.id_gym_branch);

        const idVisit = await createVisitRecord(
            conn,
            req.body,
            //folio,
            externalVisitorId,
            payment
        );

        await savePaymentMethods(
            conn,
            idVisit,
            req.body.payment_methods
        );

        /*const receipt = await generateReceiptPdf(
            conn,
            idVisit
        );*/
       let name_visit = '';

        if (req.body.visitor_type === 'MEMBER') {

            name_visit = await VisitsModel.getMemberName(
                conn,
                req.body.id_member
            );

        } else {

            name_visit = req.body.full_name.trim();

        }


         
        const pdfBuffer = await generateReceiptPdf({
                            date: new Date().toLocaleDateString(),
                            total: req.body.total_amount,
                            discount: req.body.discount_amount,
                            members: name_visit,
                            concept: "VISITA",
                            payment_methods: req.body.payment_methods,
                            next_payment_date: 'NO APLICA',
                            status: req.body.paymentStatus,
                            attended_by: req.body.name,
                            folio: req.body.folio,
                            //payment_method_name: payment_method_name,
                            payment_type: req.body.visitor_type,
                             is_cancelled: false
                        });

        const now = new Date();

        const timestamp = now
            .toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];

        const fileName = `${req.body.folio}_${timestamp}.pdf`;

        const filePath = await uploadReceipt(pdfBuffer, fileName);
        
        await VisitsModel.updateReceiptPath(conn, idVisit, filePath );

        if (req.body.send_mail) {

           // await sendReceiptEmail(req.body.email, pdfBuffer, req.body.folio);
        }

        await conn.commit();

        return {
            success: true,
            id_visit: idVisit,
            visit_folio: req.body.folio
        };

    } catch (error) {

        await conn.rollback();

        throw error;

    } finally {

        conn.release();

    }

};


function validateCreateVisit(data) {

    if (!data.id_visit_type)
        throw new Error("Visit type is required");

    if (!data.visitor_type)
        throw new Error("Visitor type is required");

    if (data.visitor_type === "MEMBER" && !data.id_member)
        throw new Error("Member is required");

    if (
        data.visitor_type === "EXTERNAL" &&
        !data.full_name
    )
        throw new Error("Visitor name is required");

    if (!data.payment_methods.length)
        throw new Error("Payment method required");

}

function calculatePaymentStatus(data) {

    const paidAmount = data.payment_methods.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );

    const pendingAmount =
        (data.total_amount - data.discount_amount) -
        paidAmount;

    const paymentStatus =
        pendingAmount <= 0
            ? "PAGADO"
            : paidAmount > 0
            ? "PARCIAL"
            : "PENDIENTE";

    return {

        paidAmount,

        pendingAmount,

        paymentStatus

    };

}

async function getOrCreateExternalVisitor(conn, data) {

    if (data.visitor_type !== 'EXTERNAL') {
        return null;
    }

    return await VisitsModel.getOrCreateExternalVisitor(
        conn,
        data.full_name.trim()
    );

}

async function generateVisitFolio(
    conn,
    idGymBranch
) {

    return await VisitsModel.generateVisitFolio(
        conn,
        idGymBranch
    );

}

async function createVisitRecord(

    conn,

    data,

    //folio,

    externalVisitorId,

    payment

) {

    return await VisitsModel.createVisit(

        conn,

        {

            ...data,

            //visit_folio: folio,

            id_external_visitor: externalVisitorId,

            ...payment

        }

    );

}

async function savePaymentMethods(

    conn,

    idVisit,

    methods

) {

    for (const item of methods) {

        await VisitsModel.createVisitPaymentMethod(

            conn,

            idVisit,

            item

        );

    }

}

exports.getAllVisits = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const filters = {

            id_gym_branch: req.query.id_gym_branch,

            visitor_type: req.query.visitor_type,

            payment_status: req.query.payment_status,

            start_date: req.query.start_date,

            end_date: req.query.end_date,

            search: req.query.search

        };

        const visits = await VisitsModel.getAllVisits(
            conn,
            filters
        );

        return {

            success: true,

            data: visits

        };

    } finally {

        conn.release();

    }

};


exports.getVisitTypes = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const visitTypes = await VisitsModel.getVisitTypes(conn);

        return {
            success: true,
            data: visitTypes
        };

    } catch (error) {

        throw error;

    } finally {

        conn.release();

    }

};

exports.searchMembers = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const search = req.query.q || req.query.search || '';
        const idGymBranch = req.query.id_gym_branch || null;

        const members = await VisitsModel.searchMembers(
            conn,
            search,
            idGymBranch
        );

        return {
            success: true,
            data: members
        };

    } catch (error) {

        throw error;

    } finally {

        conn.release();

    }

};


exports.searchExternalVisitors = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const search = req.query.q || req.query.search || '';

        const visitors = await VisitsModel.searchExternalVisitors(
            conn,
            search
        );

        return {
            success: true,
            data: visitors
        };

    } catch (error) {

        throw error;

    } finally {

        conn.release();

    }

};